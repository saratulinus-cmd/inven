import { NextResponse } from "next/server";
import pMap from "p-map";

import onlinePrisma from "@/lib/onlinePrisma";
import offlinePrisma from "@/lib/oflinePrisma";

// Helper function to ensure database connections
async function ensureConnections() {
  try {
    // Ensure both clients are connected
    await Promise.all([
      onlinePrisma.$connect(),
      offlinePrisma.$connect()
    ]);
    console.log("Both Prisma clients connected successfully");
  } catch (error) {
    console.error("Failed to connect Prisma clients:", error);
    throw new Error("Database connection failed");
  }
}

// Helper function to test connections
async function testConnections() {
  try {
    // Test online connection
    await onlinePrisma.$queryRaw`SELECT 1`;
    // Test offline connection  
    await offlinePrisma.$queryRaw`SELECT 1`;
    console.log("Database connections tested successfully");
  } catch (error) {
    console.error("Database connection test failed:", error);
    throw new Error("Database connection test failed");
  }
}

export async function POST() {
  try {
    // Ensure connections before starting sync
    await ensureConnections();
    await testConnections();

    let totalSynced = 0;
    const syncResults = {
      warehouses: 0,
      users: 0,
      receiptSettings: 0,
      products: 0,
      customers: 0,
      suppliers: 0,
      sales: 0,
      purchases: 0,
      saleItems: 0,
      purchaseItems: 0,
      paymentMethods: 0
    };

    // 1. Sync warehouses from online to offline (download)
    console.log("Starting warehouses sync (download)...");
    const warehouses = await onlinePrisma.warehouses_online.findMany();
    await pMap(warehouses, async (data) => {
      await offlinePrisma.warehouses.upsert({
        where: { warehouseCode: data.warehouseCode },
        update: { 
          ...data, 
          sync: true, 
          syncedAt: new Date() 
        },
        create: { 
          ...data, 
          sync: true, 
          syncedAt: new Date() 
        },
      });
    }, { concurrency: 3 });
    syncResults.warehouses = warehouses.length;
    totalSynced += warehouses.length;
    console.log(`Synced ${warehouses.length} warehouses`);

    // 2. Sync users from online to offline (download)
    console.log("Starting users sync (download)...");
    const users = await onlinePrisma.users_online.findMany();
    await pMap(users, async (data) => {
      const { warehouses_onlineId: warehousesId, ...rest } = data;
      await offlinePrisma.users.upsert({
        where: { userName: data.userName },
        update: { 
          ...rest, 
          warehousesId, 
          sync: true, 
          syncedAt: new Date() 
        },
        create: { 
          ...rest, 
          warehousesId, 
          sync: true, 
          syncedAt: new Date() 
        },
      });
    }, { concurrency: 3 });
    syncResults.users = users.length;
    totalSynced += users.length;
    console.log(`Synced ${users.length} users`);

    // 3. Sync unsynced receipt settings from offline to online (upload)
    console.log("Starting receipt settings sync (upload)...");
    const receiptSettings = await offlinePrisma.receiptSettings.findMany({
      where: { sync: false, isDeleted: false }
    });
    await pMap(receiptSettings, async (data) => {
      const { warehousesId: warehouses_onlineId, ...rest } = data;
      await onlinePrisma.receiptSettings_online.upsert({
        where: { warehouses_onlineId: data.warehousesId },
        update: { 
          ...rest, 
          warehouses_onlineId, 
          sync: true, 
          syncedAt: new Date() 
        },
        create: { 
          ...rest, 
          warehouses_onlineId, 
          sync: true, 
          syncedAt: new Date() 
        },
      });
      
      // Mark as synced in offline database
      await offlinePrisma.receiptSettings.update({
        where: { id: data.id },
        data: { sync: true, syncedAt: new Date() }
      });
    }, { concurrency: 3 });
    syncResults.receiptSettings = receiptSettings.length;
    totalSynced += receiptSettings.length;
    console.log(`Synced ${receiptSettings.length} receipt settings`);

    // 4. Sync unsynced products from offline to online (upload)
    console.log("Starting products sync (upload)...");
    const products = await offlinePrisma.product.findMany({ 
      where: { sync: false, isDeleted: false } 
    });
    await pMap(products, async (data) => {
      const { warehousesId: warehouses_onlineId, ...rest } = data;
      await onlinePrisma.product_online.upsert({
        where: { id: data.id },
        update: { 
          ...rest, 
          warehouses_onlineId, 
          sync: true, 
          syncedAt: new Date() 
        },
        create: { 
          ...rest, 
          warehouses_onlineId, 
          sync: true, 
          syncedAt: new Date() 
        },
      });
      
      // Mark as synced in offline database
      await offlinePrisma.product.update({
        where: { id: data.id },
        data: { sync: true, syncedAt: new Date() }
      });
    }, { concurrency: 3 });
    syncResults.products = products.length;
    totalSynced += products.length;
    console.log(`Synced ${products.length} products`);

    // 5. Sync unsynced customers from offline to online (upload)
    console.log("Starting customers sync (upload)...");
    const customers = await offlinePrisma.customer.findMany({ 
      where: { sync: false, isDeleted: false } 
    });
    await pMap(customers, async (data) => {
      const { warehousesId: warehouses_onlineId, ...rest } = data;
      await onlinePrisma.customer_online.upsert({
        where: { id: data.id },
        update: { 
          ...rest, 
          warehouses_onlineId, 
          sync: true, 
          syncedAt: new Date() 
        },
        create: { 
          ...rest, 
          warehouses_onlineId, 
          sync: true, 
          syncedAt: new Date() 
        },
      });
      
      // Mark as synced in offline database
      await offlinePrisma.customer.update({
        where: { id: data.id },
        data: { sync: true, syncedAt: new Date() }
      });
    }, { concurrency: 3 });
    syncResults.customers = customers.length;
    totalSynced += customers.length;
    console.log(`Synced ${customers.length} customers`);

    // 6. Sync unsynced suppliers from offline to online (upload)
    console.log("Starting suppliers sync (upload)...");
    const suppliers = await offlinePrisma.supplier.findMany({ 
      where: { sync: false, isDeleted: false } 
    });
    await pMap(suppliers, async (data) => {
      const { warehousesId: warehouses_onlineId, ...rest } = data;
      await onlinePrisma.supplier_online.upsert({
        where: { id: data.id },
        update: { 
          ...rest, 
          warehouses_onlineId, 
          sync: true, 
          syncedAt: new Date() 
        },
        create: { 
          ...rest, 
          warehouses_onlineId, 
          sync: true, 
          syncedAt: new Date() 
        },
      });
      
      // Mark as synced in offline database
      await offlinePrisma.supplier.update({
        where: { id: data.id },
        data: { sync: true, syncedAt: new Date() }
      });
    }, { concurrency: 3 });
    syncResults.suppliers = suppliers.length;
    totalSynced += suppliers.length;
    console.log(`Synced ${suppliers.length} suppliers`);

    // 7. Sync unsynced sales from offline to online (upload)
    console.log("Starting sales sync (upload)...");
    const sales = await offlinePrisma.sale.findMany({ 
      where: { sync: false, isDeleted: false } 
    });
    await pMap(sales, async (data) => {
      const { warehousesId: warehouses_onlineId, selectedCustomerId: customer_onlineId, ...rest } = data;
      await onlinePrisma.sale_online.upsert({
        where: { invoiceNo: data.invoiceNo },
        update: { 
          ...rest, 
          warehouses_onlineId, 
          customer_onlineId, 
          sync: true, 
          syncedAt: new Date() 
        },
        create: { 
          ...rest, 
          warehouses_onlineId, 
          customer_onlineId, 
          sync: true, 
          syncedAt: new Date() 
        },
      });
      
      // Mark as synced in offline database
      await offlinePrisma.sale.update({
        where: { invoiceNo: data.invoiceNo },
        data: { sync: true, syncedAt: new Date() }
      });
    }, { concurrency: 3 });
    syncResults.sales = sales.length;
    totalSynced += sales.length;
    console.log(`Synced ${sales.length} sales`);

    // 8. Sync unsynced purchases from offline to online (upload)
    console.log("Starting purchases sync (upload)...");
    const purchases = await offlinePrisma.purchase.findMany({ 
      where: { sync: false, isDeleted: false } 
    });
    await pMap(purchases, async (data) => {
      const { warehousesId: warehouses_onlineId, supplierId: supplier_onlineId, ...rest } = data;
      await onlinePrisma.purchase_online.upsert({
        where: { referenceNo: data.referenceNo },
        update: { 
          ...rest, 
          warehouses_onlineId, 
          supplier_onlineId, 
          sync: true, 
          syncedAt: new Date() 
        },
        create: { 
          ...rest, 
          warehouses_onlineId, 
          supplier_onlineId, 
          sync: true, 
          syncedAt: new Date() 
        },
      });
      
      // Mark as synced in offline database
      await offlinePrisma.purchase.update({
        where: { referenceNo: data.referenceNo },
        data: { sync: true, syncedAt: new Date() }
      });
    }, { concurrency: 3 });
    syncResults.purchases = purchases.length;
    totalSynced += purchases.length;
    console.log(`Synced ${purchases.length} purchases`);

    // 9. Sync unsynced sale items from offline to online (upload)
    console.log("Starting sale items sync (upload)...");
    const saleItems = await offlinePrisma.saleItem.findMany({ 
      where: { sync: false, isDeleted: false } 
    });
    await pMap(saleItems, async (data) => {
      const { warehousesId: warehouses_onlineId, saleId: sale_onlineId, customerId: customer_onlineId, productId: product_onlineId, ...rest } = data;
      await onlinePrisma.saleItem_online.upsert({
        where: { id: data.id },
        update: { 
          ...rest, 
          warehouses_onlineId, 
          sale_onlineId, 
          product_onlineId, 
          customer_onlineId, 
          sync: true, 
          syncedAt: new Date() 
        },
        create: { 
          ...rest, 
          warehouses_onlineId, 
          sale_onlineId, 
          product_onlineId, 
          customer_onlineId, 
          sync: true, 
          syncedAt: new Date() 
        },
      });
      
      // Mark as synced in offline database
      await offlinePrisma.saleItem.update({
        where: { id: data.id },
        data: { sync: true, syncedAt: new Date() }
      });
    }, { concurrency: 3 });
    syncResults.saleItems = saleItems.length;
    totalSynced += saleItems.length;
    console.log(`Synced ${saleItems.length} sale items`);

    // 10. Sync unsynced purchase items from offline to online (upload)
    console.log("Starting purchase items sync (upload)...");
    const purchaseItems = await offlinePrisma.purchaseItem.findMany({ 
      where: { sync: false, isDeleted: false } 
    });
    await pMap(purchaseItems, async (data) => {
      const { warehousesId: warehouses_onlineId, purchaseId: purchase_onlineId, productId: product_onlineId, ...rest } = data;
      await onlinePrisma.purchaseItem_online.upsert({
        where: { id: data.id },
        update: { 
          ...rest, 
          warehouses_onlineId, 
          product_onlineId, 
          purchase_onlineId, 
          sync: true, 
          syncedAt: new Date() 
        },
        create: { 
          ...rest, 
          warehouses_onlineId, 
          product_onlineId, 
          purchase_onlineId, 
          sync: true, 
          syncedAt: new Date() 
        },
      });
      
      // Mark as synced in offline database
      await offlinePrisma.purchaseItem.update({
        where: { id: data.id },
        data: { sync: true, syncedAt: new Date() }
      });
    }, { concurrency: 3 });
    syncResults.purchaseItems = purchaseItems.length;
    totalSynced += purchaseItems.length;
    console.log(`Synced ${purchaseItems.length} purchase items`);

    // 11. Sync unsynced payment methods from offline to online (upload)
    console.log("Starting payment methods sync (upload)...");
    const paymentMethods = await offlinePrisma.paymentMethod.findMany({ 
      where: { sync: false, isDeleted: false } 
    });
    await pMap(paymentMethods, async (data) => {
      const { warehousesId: warehouses_onlineId, saleId: sale_onlineId, ...rest } = data;
      await onlinePrisma.paymentMethod_online.upsert({
        where: { id: data.id },
        update: { 
          ...rest, 
          warehouses_onlineId, 
          sale_onlineId, 
          sync: true, 
          syncedAt: new Date() 
        },
        create: { 
          ...rest, 
          warehouses_onlineId, 
          sale_onlineId, 
          sync: true, 
          syncedAt: new Date() 
        },
      });
      
      // Mark as synced in offline database
      await offlinePrisma.paymentMethod.update({
        where: { id: data.id },
        data: { sync: true, syncedAt: new Date() }
      });
    }, { concurrency: 3 });
    syncResults.paymentMethods = paymentMethods.length;
    totalSynced += paymentMethods.length;
    console.log(`Synced ${paymentMethods.length} payment methods`);

    console.log("Sync completed successfully");
    return NextResponse.json({ 
      status: 200, 
      message: "Sync completed successfully", 
      totalSynced,
      syncResults,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Sync error:", error);
    
    // Return more detailed error information
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    const isConnectionError = errorMessage.includes("connection") || errorMessage.includes("connect");
    
    return NextResponse.json({ 
      status: 500, 
      message: "Sync failed", 
      error: errorMessage,
      isConnectionError,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
