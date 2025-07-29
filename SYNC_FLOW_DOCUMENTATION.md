# Unsynced Data Management System

## Overview

This system ensures that only modified/new data gets synced between offline and online databases. Any create, update, or delete operation automatically marks records as unsynced (`sync: false`) so they will be included in the next sync operation.

## Key Features

✅ **Automatic Sync Tracking**: All CRUD operations automatically mark records as unsynced  
✅ **Smart Relationship Tracking**: Related records are also marked when dependencies change  
✅ **Efficient Syncing**: Only unsynced records are processed during sync operations  
✅ **Deletion Tracking**: Soft deletes are tracked and synced properly  
✅ **Connection Management**: Robust database connection handling with auto-retry  
✅ **Comprehensive Logging**: Detailed logs for debugging and monitoring  

## How It Works

### 1. **Record Creation**
When any record is created (product, customer, supplier, sale, purchase):
- `sync: false` is automatically set
- `syncedAt: null` is set
- Record will be included in next sync

### 2. **Record Updates**
When any record is updated:
- `sync: false` is automatically set
- `syncedAt: null` is set
- `updatedAt` is updated to current timestamp
- Related records may also be marked as unsynced

### 3. **Record Deletion**
When any record is deleted:
- `isDeleted: true` is set (soft delete)
- `sync: false` is set to sync the deletion
- `syncedAt: null` is set
- Related records are updated accordingly

### 4. **Sync Operation**
The sync process:
1. Downloads new data from online database (warehouses, users)
2. Uploads only unsynced records to online database
3. Marks successfully synced records as `sync: true`
4. Sets `syncedAt` timestamp for synced records

## API Endpoints

### Core CRUD APIs (Updated with Sync Tracking)

#### Products (`/api/product`)
- `POST` - Create product (auto-marked as unsynced)
- `PUT` - Update product (auto-marked as unsynced)
- `DELETE` - Delete product (auto-marked as unsynced)
- `GET` - List products

#### Customers (`/api/customer`)
- `POST` - Create customer (auto-marked as unsynced)
- `PUT` - Update customer (auto-marked as unsynced)
- `DELETE` - Delete customer (auto-marked as unsynced)
- `GET` - List customers

#### Suppliers (`/api/supplier`)
- `POST` - Create supplier (auto-marked as unsynced)
- `PUT` - Update supplier (auto-marked as unsynced)
- `DELETE` - Delete supplier (auto-marked as unsynced)
- `GET` - List suppliers

#### Sales (`/api/sale`)
- `POST` - Create sale (marks sale, sale items, products, payment methods as unsynced)
- `DELETE` - Delete sale (restores product quantities, marks all related as unsynced)

#### Purchases (`/api/purchase`)
- `POST` - Create purchase (marks purchase, purchase items, products as unsynced)
- `DELETE` - Delete purchase (restores product quantities, marks all related as unsynced)

### Sync Management APIs

#### Sync Status (`/api/sync/status`)
```json
GET /api/sync/status
{
  "success": true,
  "data": {
    "products": 5,
    "customers": 2,
    "suppliers": 1,
    "sales": 3,
    "purchases": 0,
    "saleItems": 8,
    "purchaseItems": 0,
    "paymentMethods": 3,
    "users": 0,
    "receiptSettings": 1,
    "total": 23
  },
  "message": "23 records need syncing"
}
```

#### Sync Operation (`/api/syncNew`)
```json
POST /api/syncNew
{
  "status": 200,
  "message": "Sync completed successfully",
  "totalSynced": 23,
  "syncResults": {
    "warehouses": 2,
    "users": 1,
    "receiptSettings": 1,
    "products": 5,
    "customers": 2,
    "suppliers": 1,
    "sales": 3,
    "purchases": 0,
    "saleItems": 8,
    "purchaseItems": 0,
    "paymentMethods": 3
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Implementation Details

### 1. **Sync Helpers (`lib/sync-helpers.ts`)**
Utility functions for marking records as unsynced:
- `markProductAsUnsynced(productId)`
- `markCustomerAsUnsynced(customerId)`
- `markSupplierAsUnsynced(supplierId)`
- `markRelatedRecordsAsUnsynced(operation)`
- `getUnsyncedCounts()` - Get counts for dashboard

### 2. **Database Connection Management**
- Auto-connection on module import
- Connection testing before operations
- Graceful error handling
- Connection pooling with concurrency limits

### 3. **Relationship Tracking**
When operations affect multiple entities:

**Sale Creation/Deletion:**
- Sale record
- Sale items
- Products (quantity changes)
- Customer (if updated)
- Payment methods

**Purchase Creation/Deletion:**
- Purchase record
- Purchase items
- Products (quantity changes)
- Supplier (if updated)

**Product Updates:**
- Product record only (unless part of sale/purchase)

## Usage Examples

### Creating a Product
```javascript
// Product is automatically marked as unsynced
const response = await fetch('/api/product', {
  method: 'POST',
  body: JSON.stringify({
    productName: 'New Product',
    productCode: 'NP001',
    // ... other fields
  })
});
// Product will be synced on next sync operation
```

### Making a Sale
```javascript
// Sale, sale items, products, and payment methods are marked as unsynced
const response = await fetch('/api/sale', {
  method: 'POST',
  body: JSON.stringify({
    items: [{ productId: 'prod1', quantity: 2 }],
    customer: { id: 'cust1' },
    paymentMethods: [{ method: 'cash', amount: 100 }],
    // ... other fields
  })
});
// All related records will be synced on next sync operation
```

### Checking Sync Status
```javascript
const response = await fetch('/api/sync/status');
const { data } = await response.json();
console.log(`${data.total} records need syncing`);
```

### Running Sync
```javascript
const response = await fetch('/api/syncNew', { method: 'POST' });
const result = await response.json();
console.log(`Synced ${result.totalSynced} records`);
```

## Database Schema Requirements

All syncable tables must have these fields:
```sql
sync BOOLEAN DEFAULT false
syncedAt DATETIME NULL
updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
isDeleted BOOLEAN DEFAULT false
```

## Monitoring and Debugging

### Logs
All operations log their sync status:
```
Product created: prod-123 - marked as unsynced
Sale created: INV-001 with 3 items - all related records marked as unsynced
Sync completed: 15 records synced successfully
```

### Error Handling
- Connection errors are retried with exponential backoff
- Sync errors don't affect main operations
- Detailed error messages for debugging

### Dashboard Integration
Use `/api/sync/status` to show:
- Number of unsynced records
- Last sync time
- Sync status indicator
- Sync progress during operations

## Best Practices

1. **Always check sync status** before important operations
2. **Run sync regularly** when online (every 10-30 seconds)
3. **Handle sync failures gracefully** with retry logic
4. **Monitor sync performance** and adjust concurrency if needed
5. **Test offline scenarios** to ensure data integrity

## Troubleshooting

### Common Issues

**"Engine is not yet connected" Error:**
- Fixed with automatic connection management
- Connections are tested before operations

**High Memory Usage:**
- Concurrency is limited to 3 operations at once
- Large datasets are processed in batches

**Sync Taking Too Long:**
- Only unsynced records are processed
- Consider increasing concurrency for faster networks

**Missing Records After Sync:**
- Check if records are marked as `isDeleted: true`
- Verify database connections are stable
- Check logs for specific error messages

## Performance Considerations

- **Batch Size**: Limited to 3 concurrent operations to prevent database overload
- **Filtering**: Only `sync: false` and `isDeleted: false` records are processed
- **Indexing**: Ensure indexes on `sync`, `isDeleted`, and `updatedAt` fields
- **Connection Pooling**: Reuse database connections where possible

This system ensures efficient, reliable data synchronization while maintaining data integrity and providing excellent developer experience.