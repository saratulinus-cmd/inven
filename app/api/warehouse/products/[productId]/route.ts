import { NextRequest, NextResponse } from "next/server";
import onlinePrisma from "@/lib/onlinePrisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get('warehouseId');

    if (!warehouseId) {
      return NextResponse.json(
        { error: "Warehouse ID is required" },
        { status: 400 }
      );
    }

    // Find warehouse by code or id
    let warehouse = await onlinePrisma.warehouses_online.findFirst({
      where: {
        OR: [
          { warehouseCode: warehouseId, isDeleted: false },
          { id: warehouseId, isDeleted: false }
        ]
      }
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: "Warehouse not found" },
        { status: 404 }
      );
    }

    // Get product details
    const product = await onlinePrisma.products_online.findFirst({
      where: {
        id: params.productId,
        warehousesId: warehouse.warehouseCode,
        isDeleted: false
      }
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Get sales history for this product
    const salesHistory = await onlinePrisma.saleItems_online.findMany({
      where: {
        productId: params.productId,
        sale: {
          warehousesId: warehouse.warehouseCode,
          isDeleted: false
        }
      },
      include: {
        sale: {
          include: {
            selectedCustomer: true
          }
        }
      },
      orderBy: {
        sale: {
          createdAt: 'desc'
        }
      },
      take: 50
    });

    // Get purchase history for this product
    const purchaseHistory = await onlinePrisma.purchaseItems_online.findMany({
      where: {
        productId: params.productId,
        purchase: {
          warehousesId: warehouse.warehouseCode,
          isDeleted: false
        }
      },
      include: {
        purchase: {
          include: {
            selectedSupplier: true
          }
        }
      },
      orderBy: {
        purchase: {
          createdAt: 'desc'
        }
      },
      take: 50
    });

    // Calculate statistics
    const totalSold = salesHistory.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalPurchased = purchaseHistory.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalRevenue = salesHistory.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0);
    const totalCost = purchaseHistory.reduce((sum, item) => sum + ((item.quantity || 0) * (item.cost || 0)), 0);
    const profit = totalRevenue - totalCost;

    // Get monthly sales data for the last 12 months
    const monthlySales = await onlinePrisma.saleItems_online.groupBy({
      by: ['sale'],
      where: {
        productId: params.productId,
        sale: {
          warehousesId: warehouse.warehouseCode,
          isDeleted: false,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
          }
        }
      },
      _sum: {
        quantity: true,
        price: true
      }
    });

    const monthlyData = monthlySales.map(item => ({
      month: item.sale.createdAt,
      quantity: item._sum.quantity || 0,
      revenue: (item._sum.quantity || 0) * (item._sum.price || 0)
    }));

    const response = {
      product,
      statistics: {
        totalSold,
        totalPurchased,
        totalRevenue,
        totalCost,
        profit,
        currentStock: product.quantity,
        stockValue: product.quantity * product.cost
      },
      salesHistory: salesHistory.slice(0, 20), // Limit to 20 most recent
      purchaseHistory: purchaseHistory.slice(0, 20), // Limit to 20 most recent
      monthlyData,
      warehouse: {
        id: warehouse.id,
        warehouseCode: warehouse.warehouseCode,
        name: warehouse.name
      }
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error("Error fetching product details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await onlinePrisma.$disconnect();
  }
}