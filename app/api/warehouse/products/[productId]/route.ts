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
    const product = await onlinePrisma.product_online.findFirst({
      where: {
        id: params.productId,
        warehouses_onlineId: warehouse.warehouseCode,
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
    const salesHistory = await onlinePrisma.saleItem_online.findMany({
      where: {
        product_onlineId: params.productId,
        Sale_online: {
          warehouses_onlineId: warehouse.warehouseCode,
          isDeleted: false
        }
      },
      include: {
        Sale_online: {
          include: {
            Customer_online: true
          }
        }
      },
      orderBy: {
        Sale_online: {
          createdAt: 'desc'
        }
      },
      take: 50
    });

    // Get purchase history for this product
    const purchaseHistory = await onlinePrisma.purchaseItem_online.findMany({
      where: {
        product_onlineId: params.productId,
        Purchase_online: {
          warehouses_onlineId: warehouse.warehouseCode,
          isDeleted: false
        }
      },
      include: {
        Purchase_online: {
          include: {
            Supplier_online: true
          }
        }
      },
      orderBy: {
        Purchase_online: {
          createdAt: 'desc'
        }
      },
      take: 50
    });

    // Calculate statistics
    const totalSold = salesHistory.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalPurchased = purchaseHistory.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalRevenue = salesHistory.reduce((sum, item) => sum + ((item.quantity || 0) * (item.selectedPrice || 0)), 0);
    const totalCost = purchaseHistory.reduce((sum, item) => sum + ((item.quantity || 0) * (item.cost || 0)), 0);
    const profit = totalRevenue - totalCost;

    // Get monthly sales data for the last 12 months
    const monthlySales = await onlinePrisma.saleItem_online.groupBy({
      by: ['Sale_online'],
      where: {
        product_onlineId: params.productId,
        Sale_online: {
          warehouses_onlineId: warehouse.warehouseCode,
          isDeleted: false,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
          }
        }
      },
      _sum: {
        quantity: true,
        selectedPrice: true
      }
    });

    const monthlyData = monthlySales.map(item => ({
      month: item.Sale_online.createdAt,
      quantity: item._sum.quantity || 0,
      revenue: (item._sum.quantity || 0) * (item._sum.selectedPrice || 0)
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