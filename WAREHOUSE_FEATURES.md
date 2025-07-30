# Warehouse Management Features

This document outlines the new features implemented for the warehouse management system.

## New Features

### 1. Product Search Functionality
- **Location**: `/sup-admin/warehouses/[id]` - Products tab
- **API Endpoint**: `/api/warehouse/products/search`
- **Features**:
  - Search products by name, barcode, or description
  - Real-time search results
  - Case-insensitive search
  - Configurable search limit (default: 50 results)

### 2. Product Details Page
- **Location**: `/sup-admin/warehouses/[id]/[productId]`
- **API Endpoint**: `/api/warehouse/products/[productId]`
- **Features**:
  - Comprehensive product information
  - Sales history with customer details
  - Purchase history with supplier details
  - Stock tracking and analytics
  - Monthly sales performance charts
  - Performance metrics (profit, revenue, stock value)
  - Stock status indicators

### 3. Export Reports
- **API Endpoint**: `/api/warehouse/reports/export`
- **Supported Report Types**:
  - **Inventory Report**: Complete product inventory with stock levels
  - **Sales Report**: Monthly sales data with customer information
  - **Monthly Report**: Comprehensive monthly report including inventory and sales
- **Features**:
  - CSV format export
  - Configurable month/year selection
  - Automatic file download
  - Detailed product and sales information

### 4. Monthly Report Generation
- **API Endpoint**: `/api/warehouse/reports/monthly`
- **Features**:
  - Complete monthly analytics
  - Inventory summary
  - Sales performance data
  - Top-selling products
  - Daily sales breakdown
  - Customer analytics

## API Endpoints

### Product Search
```http
POST /api/warehouse/products/search
Content-Type: application/json

{
  "warehouseId": "string",
  "searchTerm": "string",
  "limit": 50
}
```

### Product Details
```http
GET /api/warehouse/products/{productId}?warehouseId={warehouseId}
```

### Export Reports
```http
POST /api/warehouse/reports/export
Content-Type: application/json

{
  "warehouseId": "string",
  "reportType": "inventory|sales|monthly",
  "month": 1-12,
  "year": 2024
}
```

### Monthly Report
```http
POST /api/warehouse/reports/monthly
Content-Type: application/json

{
  "warehouseId": "string",
  "month": 1-12,
  "year": 2024,
  "reportType": "all|inventory|sales"
}
```

## Database Integration

All features work with the online database using the `onlinePrisma` client with the correct online schema. The system supports:

- **Warehouses_online**: Full warehouse information and statistics
- **Product_online**: Complete product details with pricing and stock levels
- **Sale_online**: Sales transactions with customer information
- **Purchase_online**: Purchase transactions with supplier information
- **SaleItem_online**: Individual sale items with product relationships
- **PurchaseItem_online**: Individual purchase items with product relationships
- **Customer_online**: Customer information and relationships
- **Supplier_online**: Supplier information and relationships
- **Users_online**: Warehouse staff and permissions

### Key Schema Relationships:
- Products are linked to warehouses via `warehouses_onlineId`
- Sale items are linked to products via `product_onlineId`
- Sale items are linked to sales via `sale_onlineId`
- Purchase items are linked to products via `product_onlineId`
- Purchase items are linked to purchases via `purchase_onlineId`

## Usage Instructions

### Searching Products
1. Navigate to a warehouse details page
2. Go to the "Products" tab
3. Use the search box to find products by name, barcode, or description
4. Results are displayed in real-time

### Viewing Product Details
1. From the products table, click "View Details" button
2. Navigate through the different tabs:
   - **Analytics**: Sales performance and charts
   - **Sales History**: Recent sales transactions
   - **Purchase History**: Recent purchase transactions
   - **Stock Tracking**: Stock level monitoring

### Exporting Reports
1. Navigate to the "Reports" tab
2. Select the desired month and year
3. Click on the appropriate export button:
   - Export Monthly Report (comprehensive)
   - Export Inventory Report (product stock)
   - Export Sales Report (sales data)
   - Generate Monthly Analytics (detailed analytics)

## File Structure

```
app/
├── api/
│   └── warehouse/
│       ├── products/
│       │   ├── search/
│       │   │   └── route.ts
│       │   └── [productId]/
│       │       └── route.ts
│       └── reports/
│           ├── monthly/
│           │   └── route.ts
│           └── export/
│               └── route.ts
└── sup-admin/
    └── warehouses/
        └── [id]/
            ├── page.tsx (updated)
            └── [productId]/
                └── page.tsx (new)
```

## Technical Notes

- All API endpoints use the online database for real-time data
- CSV exports are generated server-side and downloaded client-side
- Search functionality includes proper error handling and loading states
- Product details page includes comprehensive analytics and charts
- All features are responsive and work on mobile devices
- Proper breadcrumb navigation is implemented throughout

## Future Enhancements

- Advanced filtering options for product search
- PDF report generation
- Email report delivery
- Real-time stock alerts
- Product performance comparisons
- Advanced analytics and forecasting