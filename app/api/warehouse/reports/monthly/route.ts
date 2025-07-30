import { NextRequest, NextResponse } from "next/server";
import onlinePrisma from "@/lib/onlinePrisma";

export async function POST(req: NextRequest) {
  try {
    const { warehouseId, month, year, reportType = 'all' } = await req.json();

    if (!warehouseId || !month || !year) {
      return NextResponse.json(
        { error: "Warehouse ID, month, and year are required" },
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

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    let reportData: any = {
      warehouse: {
        id: warehouse.id,
        warehouseCode: warehouse.warehouseCode,
        name: warehouse.name
      },
      period: {
        month: parseInt(month),
        year: parseInt(year),
        startDate,
        endDate
      }
    };

    // Get inventory data
    if (reportType === 'all' || reportType === 'inventory') {
      const products = await onlinePrisma.products_online.findMany({
        where: {
          warehousesId: warehouse.warehouseCode,
          isDeleted: false
        },
        orderBy: {
          name: 'asc'
        }
      });

      const inventorySummary = {
        totalProducts: products.length,
        totalStockValue: products.reduce((sum, p) => sum + (p.quantity * p.cost), 0),
        lowStockItems: products.filter(p => p.quantity <= 10).length,
        outOfStockItems: products.filter(p => p.quantity === 0).length,
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          barcode: p.barcode,
          quantity: p.quantity,
          unit: p.unit,
          cost: p.cost,
          wholesalePrice: p.wholeSalePrice,
          retailPrice: p.retailPrice,
          stockValue: p.quantity * p.cost,
          status: p.quantity === 0 ? 'Out of Stock' : p.quantity <= 10 ? 'Low Stock' : 'In Stock'
        }))
      };

      reportData.inventory = inventorySummary;
    }

    // Get sales data
    if (reportType === 'all' || reportType === 'sales') {
      const sales = await onlinePrisma.sale_online.findMany({
        where: {
          warehousesId: warehouse.warehouseCode,
          isDeleted: false,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          saleItems: {
            include: {
              product: true
            }
          },
          selectedCustomer: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const salesSummary = {
        totalSales: sales.length,
        totalRevenue: sales.reduce((sum, s) => sum + (s.grandTotal || 0), 0),
        totalItems: sales.reduce((sum, s) => sum + s.saleItems.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0), 0),
        averageOrderValue: sales.length > 0 ? sales.reduce((sum, s) => sum + (s.grandTotal || 0), 0) / sales.length : 0,
        completedPayments: sales.filter(s => s.balance === 0).length,
        pendingPayments: sales.filter(s => s.balance > 0).length,
        sales: sales.map(s => ({
          id: s.id,
          invoiceNo: s.invoiceNo,
          date: s.createdAt,
          customer: s.selectedCustomer?.name || 'Walk-in Customer',
          items: s.saleItems.length,
          total: s.grandTotal,
          balance: s.balance,
          status: s.balance === 0 ? 'Paid' : s.balance === s.grandTotal ? 'Unpaid' : 'Partial'
        }))
      };

      reportData.sales = salesSummary;
    }

    // Get daily sales breakdown
    if (reportType === 'all' || reportType === 'sales') {
      const dailySales = await onlinePrisma.sale_online.groupBy({
        by: ['createdAt'],
        where: {
          warehousesId: warehouse.warehouseCode,
          isDeleted: false,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: {
          grandTotal: true
        },
        _count: {
          id: true
        }
      });

      reportData.dailySales = dailySales.map(d => ({
        date: d.createdAt,
        revenue: d._sum.grandTotal || 0,
        orders: d._count.id
      }));
    }

    // Get top selling products
    if (reportType === 'all' || reportType === 'sales') {
      const topProducts = await onlinePrisma.saleItems_online.groupBy({
        by: ['productId'],
        where: {
          sale: {
            warehousesId: warehouse.warehouseCode,
            isDeleted: false,
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        },
        _sum: {
          quantity: true,
          price: true
        },
        orderBy: {
          _sum: {
            quantity: 'desc'
          }
        },
        take: 10
      });

      const topProductsWithDetails = await Promise.all(
        topProducts.map(async (item) => {
          const product = await onlinePrisma.products_online.findUnique({
            where: { id: item.productId }
          });
          return {
            productId: item.productId,
            productName: product?.name || 'Unknown Product',
            quantity: item._sum.quantity || 0,
            revenue: (item._sum.quantity || 0) * (item._sum.price || 0)
          };
        })
      );

      reportData.topProducts = topProductsWithDetails;
    }

    return NextResponse.json(reportData, { status: 200 });

  } catch (error) {
    console.error("Error generating monthly report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await onlinePrisma.$disconnect();
  }
}