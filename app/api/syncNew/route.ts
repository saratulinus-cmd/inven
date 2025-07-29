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

    // Warehouses
    console.log("Starting warehouses sync...");
    const warehouses = await onlinePrisma.warehouses_online.findMany();
    await pMap(warehouses, async (data) => {
      await offlinePrisma.warehouses.upsert({
        where: { warehouseCode: data.warehouseCode },
        update: { ...data, syncedAt: new Date() },
        create: { ...data, syncedAt: new Date() },
      });
    }, { concurrency: 3 });
    console.log(`Synced ${warehouses.length} warehouses`);

    // Users
    console.log("Starting users sync...");
    const users = await onlinePrisma.users_online.findMany();
    await pMap(users, async (data) => {
      const { warehouses_onlineId: warehousesId, ...rest } = data;
      await offlinePrisma.users.upsert({
        where: { userName: data.userName },
        update: { ...rest, warehousesId, syncedAt: new Date() },
        create: { ...rest, warehousesId, syncedAt: new Date() },
      });
    }, { concurrency: 3 });
    console.log(`Synced ${users.length} users`);

    // ReceiptSettings
    console.log("Starting receipt settings sync...");
    const receiptSettings = await offlinePrisma.receiptSettings.findMany();
    await pMap(receiptSettings, async (data) => {
      const { warehousesId: warehouses_onlineId, ...rest } = data;
      await onlinePrisma.receiptSettings_online.upsert({
        where: { warehouses_onlineId: data.warehousesId },
        update: { ...rest, warehouses_onlineId, syncedAt: new Date() },
        create: { ...rest, warehouses_onlineId, syncedAt: new Date() },
      });
    }, { concurrency: 3 });
    console.log(`Synced ${receiptSettings.length} receipt settings`);

    // Products
    console.log("Starting products sync...");
    const products = await offlinePrisma.product.findMany({ where: { sync: false } });
    await pMap(
      products,
      async (data) => {
        const { warehousesId: warehouses_onlineId, ...rest } = data;
        await onlinePrisma.product_online.upsert({
          where: { id: data.id },
          update: { ...rest, warehouses_onlineId, syncedAt: new Date() },
          create: { ...rest, warehouses_onlineId, syncedAt: new Date() },
        });
      },
      { concurrency: 3 } // 👈 only 3 upserts at once to avoid pool exhaustion
    );
    console.log(`Synced ${products.length} products`);

    // Customers
    console.log("Starting customers sync...");
    const customers = await offlinePrisma.customer.findMany({ where: { sync: false } });
    await pMap(customers, async (data) => {
      const { warehousesId: warehouses_onlineId, ...rest } = data;
      await onlinePrisma.customer_online.upsert({
        where: { id: data.id },
        update: { ...rest, warehouses_onlineId, syncedAt: new Date() },
        create: { ...rest, warehouses_onlineId, syncedAt: new Date() },
      });
    }, { concurrency: 3 });
    console.log(`Synced ${customers.length} customers`);

    // Suppliers
    console.log("Starting suppliers sync...");
    const suppliers = await offlinePrisma.supplier.findMany({ where: { sync: false } });
    await pMap(suppliers, async (data) => {
      const { warehousesId: warehouses_onlineId, ...rest } = data;
      await onlinePrisma.supplier_online.upsert({
        where: { id: data.id },
        update: { ...rest, warehouses_onlineId, syncedAt: new Date() },
        create: { ...rest, warehouses_onlineId, syncedAt: new Date() },
      });
    }, { concurrency: 3 });
    console.log(`Synced ${suppliers.length} suppliers`);

    // Sales
    console.log("Starting sales sync...");
    const sales = await offlinePrisma.sale.findMany({ where: { sync: false } });
    await pMap(sales, async (data) => {
      const { warehousesId: warehouses_onlineId, selectedCustomerId: customer_onlineId, ...rest } = data;
      await onlinePrisma.sale_online.upsert({
        where: { invoiceNo: data.invoiceNo },
        update: { ...rest, warehouses_onlineId, customer_onlineId, syncedAt: new Date() },
        create: { ...rest, warehouses_onlineId, customer_onlineId, syncedAt: new Date() },
      });
    }, { concurrency: 3 });
    console.log(`Synced ${sales.length} sales`);

    // Purchases
    console.log("Starting purchases sync...");
    const purchases = await offlinePrisma.purchase.findMany({ where: { sync: false } });
    await pMap(purchases, async (data) => {
      const { warehousesId: warehouses_onlineId, supplierId: supplier_onlineId, ...rest } = data;
      await onlinePrisma.purchase_online.upsert({
        where: { referenceNo: data.referenceNo },
        update: { ...rest, warehouses_onlineId, supplier_onlineId, syncedAt: new Date() },
        create: { ...rest, warehouses_onlineId, supplier_onlineId, syncedAt: new Date() },
      });
    }, { concurrency: 3 });
    console.log(`Synced ${purchases.length} purchases`);

    // SaleItems
    console.log("Starting sale items sync...");
    const saleItems = await offlinePrisma.saleItem.findMany({ where: { sync: false } });
    await pMap(saleItems, async (data) => {
      const { warehousesId: warehouses_onlineId, saleId: sale_onlineId, customerId: customer_onlineId, productId: product_onlineId, ...rest } = data;
      await onlinePrisma.saleItem_online.upsert({
        where: { id: data.id },
        update: { ...rest, warehouses_onlineId, sale_onlineId, product_onlineId, customer_onlineId, syncedAt: new Date() },
        create: { ...rest, warehouses_onlineId, sale_onlineId, product_onlineId, customer_onlineId, syncedAt: new Date() },
      });
    }, { concurrency: 3 });
    console.log(`Synced ${saleItems.length} sale items`);

    // PurchaseItems
    console.log("Starting purchase items sync...");
    const purchaseItems = await offlinePrisma.purchaseItem.findMany({ where: { sync: false } });
    await pMap(purchaseItems, async (data) => {
      const { warehousesId: warehouses_onlineId, purchaseId: purchase_onlineId, productId: product_onlineId, ...rest } = data;
      await onlinePrisma.purchaseItem_online.upsert({
        where: { id: data.id },
        update: { ...rest, warehouses_onlineId, product_onlineId, purchase_onlineId, syncedAt: new Date() },
        create: { ...rest, warehouses_onlineId, product_onlineId, purchase_onlineId, syncedAt: new Date() },
      });
    }, { concurrency: 3 });
    console.log(`Synced ${purchaseItems.length} purchase items`);

    // PaymentMethods
    console.log("Starting payment methods sync...");
    const paymentMethods = await offlinePrisma.paymentMethod.findMany({ where: { sync: false } });
    await pMap(paymentMethods, async (data) => {
      const { warehousesId: warehouses_onlineId, saleId: sale_onlineId, ...rest } = data;
      await onlinePrisma.paymentMethod_online.upsert({
        where: { id: data.id },
        update: { ...rest, warehouses_onlineId, sale_onlineId, syncedAt: new Date() },
        create: { ...rest, warehouses_onlineId, sale_onlineId, syncedAt: new Date() },
      });
    }, { concurrency: 3 });
    console.log(`Synced ${paymentMethods.length} payment methods`);

    console.log("Sync completed successfully");
    return NextResponse.json({ status: 200, message: "Sync completed successfully." });
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
