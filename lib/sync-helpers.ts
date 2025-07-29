import offlinePrisma from "@/lib/oflinePrisma";

/**
 * Helper functions to mark records as unsynced when they are modified
 */

export interface SyncableRecord {
  id: string;
  sync?: boolean;
  syncedAt?: Date | null;
}

// Generic function to mark any record as unsynced
export async function markAsUnsynced<T extends SyncableRecord>(
  model: any,
  id: string,
  additionalData?: Partial<T>
): Promise<void> {
  try {
    await model.update({
      where: { id },
      data: {
        sync: false,
        syncedAt: null,
        updatedAt: new Date(),
        ...additionalData
      }
    });
  } catch (error) {
    console.error(`Failed to mark record ${id} as unsynced:`, error);
    throw error;
  }
}

// Specific functions for each entity type
export async function markProductAsUnsynced(productId: string, additionalData?: any): Promise<void> {
  await markAsUnsynced(offlinePrisma.product, productId, additionalData);
}

export async function markCustomerAsUnsynced(customerId: string, additionalData?: any): Promise<void> {
  await markAsUnsynced(offlinePrisma.customer, customerId, additionalData);
}

export async function markSupplierAsUnsynced(supplierId: string, additionalData?: any): Promise<void> {
  await markAsUnsynced(offlinePrisma.supplier, supplierId, additionalData);
}

export async function markSaleAsUnsynced(saleId: string, additionalData?: any): Promise<void> {
  await offlinePrisma.sale.update({
    where: { invoiceNo: saleId },
    data: {
      sync: false,
      syncedAt: null,
      updatedAt: new Date(),
      ...additionalData
    }
  });
}

export async function markPurchaseAsUnsynced(purchaseId: string, additionalData?: any): Promise<void> {
  await offlinePrisma.purchase.update({
    where: { referenceNo: purchaseId },
    data: {
      sync: false,
      syncedAt: null,
      updatedAt: new Date(),
      ...additionalData
    }
  });
}

export async function markSaleItemAsUnsynced(saleItemId: string, additionalData?: any): Promise<void> {
  await markAsUnsynced(offlinePrisma.saleItem, saleItemId, additionalData);
}

export async function markPurchaseItemAsUnsynced(purchaseItemId: string, additionalData?: any): Promise<void> {
  await markAsUnsynced(offlinePrisma.purchaseItem, purchaseItemId, additionalData);
}

export async function markPaymentMethodAsUnsynced(paymentMethodId: string, additionalData?: any): Promise<void> {
  await markAsUnsynced(offlinePrisma.paymentMethod, paymentMethodId, additionalData);
}

export async function markUserAsUnsynced(userId: string, additionalData?: any): Promise<void> {
  await offlinePrisma.users.update({
    where: { userName: userId },
    data: {
      sync: false,
      syncedAt: null,
      updatedAt: new Date(),
      ...additionalData
    }
  });
}

export async function markReceiptSettingsAsUnsynced(warehouseId: string, additionalData?: any): Promise<void> {
  await offlinePrisma.receiptSettings.update({
    where: { warehousesId: warehouseId },
    data: {
      sync: false,
      syncedAt: null,
      updatedAt: new Date(),
      ...additionalData
    }
  });
}

// Batch operations
export async function markMultipleProductsAsUnsynced(productIds: string[]): Promise<void> {
  await offlinePrisma.product.updateMany({
    where: { id: { in: productIds } },
    data: {
      sync: false,
      syncedAt: null,
      updatedAt: new Date()
    }
  });
}

export async function markRelatedRecordsAsUnsynced(operation: {
  type: 'sale' | 'purchase' | 'product_update' | 'customer_update' | 'supplier_update' | 'deletion';
  entityId: string;
  relatedIds?: {
    productIds?: string[];
    customerId?: string;
    supplierId?: string;
    saleItemIds?: string[];
    purchaseItemIds?: string[];
    paymentMethodIds?: string[];
  };
}): Promise<void> {
  const { type, entityId, relatedIds } = operation;

  try {
    switch (type) {
      case 'sale':
        // Mark sale as unsynced
        await markSaleAsUnsynced(entityId);
        
        // Mark related products as unsynced (quantity changed)
        if (relatedIds?.productIds?.length) {
          await markMultipleProductsAsUnsynced(relatedIds.productIds);
        }
        
        // Mark customer as unsynced if customer data was updated
        if (relatedIds?.customerId) {
          await markCustomerAsUnsynced(relatedIds.customerId);
        }
        
        // Mark sale items as unsynced
        if (relatedIds?.saleItemIds?.length) {
          await offlinePrisma.saleItem.updateMany({
            where: { id: { in: relatedIds.saleItemIds } },
            data: { sync: false, syncedAt: null, updatedAt: new Date() }
          });
        }
        
        // Mark payment methods as unsynced
        if (relatedIds?.paymentMethodIds?.length) {
          await offlinePrisma.paymentMethod.updateMany({
            where: { id: { in: relatedIds.paymentMethodIds } },
            data: { sync: false, syncedAt: null, updatedAt: new Date() }
          });
        }
        break;

      case 'purchase':
        // Mark purchase as unsynced
        await markPurchaseAsUnsynced(entityId);
        
        // Mark related products as unsynced (quantity changed)
        if (relatedIds?.productIds?.length) {
          await markMultipleProductsAsUnsynced(relatedIds.productIds);
        }
        
        // Mark supplier as unsynced if supplier data was updated
        if (relatedIds?.supplierId) {
          await markSupplierAsUnsynced(relatedIds.supplierId);
        }
        
        // Mark purchase items as unsynced
        if (relatedIds?.purchaseItemIds?.length) {
          await offlinePrisma.purchaseItem.updateMany({
            where: { id: { in: relatedIds.purchaseItemIds } },
            data: { sync: false, syncedAt: null, updatedAt: new Date() }
          });
        }
        break;

      case 'product_update':
        await markProductAsUnsynced(entityId);
        break;

      case 'customer_update':
        await markCustomerAsUnsynced(entityId);
        break;

      case 'supplier_update':
        await markSupplierAsUnsynced(entityId);
        break;

      case 'deletion':
        // For deletions, we still need to sync the deletion status
        // The specific entity type should be handled by the caller
        break;
    }
  } catch (error) {
    console.error(`Failed to mark related records as unsynced for ${type} operation:`, error);
    throw error;
  }
}

// Function to get unsynced records count for dashboard
export async function getUnsyncedCounts(): Promise<{
  products: number;
  customers: number;
  suppliers: number;
  sales: number;
  purchases: number;
  saleItems: number;
  purchaseItems: number;
  paymentMethods: number;
  users: number;
  receiptSettings: number;
  total: number;
}> {
  try {
    const [
      products,
      customers,
      suppliers,
      sales,
      purchases,
      saleItems,
      purchaseItems,
      paymentMethods,
      users,
      receiptSettings
    ] = await Promise.all([
      offlinePrisma.product.count({ where: { sync: false, isDeleted: false } }),
      offlinePrisma.customer.count({ where: { sync: false, isDeleted: false } }),
      offlinePrisma.supplier.count({ where: { sync: false, isDeleted: false } }),
      offlinePrisma.sale.count({ where: { sync: false, isDeleted: false } }),
      offlinePrisma.purchase.count({ where: { sync: false, isDeleted: false } }),
      offlinePrisma.saleItem.count({ where: { sync: false, isDeleted: false } }),
      offlinePrisma.purchaseItem.count({ where: { sync: false, isDeleted: false } }),
      offlinePrisma.paymentMethod.count({ where: { sync: false, isDeleted: false } }),
      offlinePrisma.users.count({ where: { sync: false, isDeleted: false } }),
      offlinePrisma.receiptSettings.count({ where: { sync: false, isDeleted: false } })
    ]);

    const total = products + customers + suppliers + sales + purchases + 
                 saleItems + purchaseItems + paymentMethods + users + receiptSettings;

    return {
      products,
      customers,
      suppliers,
      sales,
      purchases,
      saleItems,
      purchaseItems,
      paymentMethods,
      users,
      receiptSettings,
      total
    };
  } catch (error) {
    console.error('Failed to get unsynced counts:', error);
    throw error;
  }
}