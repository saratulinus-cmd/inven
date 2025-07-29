import { NextRequest, NextResponse } from "next/server";
import offlinePrisma from "@/lib/oflinePrisma";

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();

    // Try to find warehouse by warehouseCode first
    let warehouse = await offlinePrisma.warehouses.findUnique({
      where: {
        warehouseCode: id,
        isDeleted: false
      },
      include: {
        users: {
          where: { isDeleted: false }
        },
        products: {
          where: { isDeleted: false },
          orderBy: { name: 'asc' }
        },
        sale: {
          where: { isDeleted: false },
          include: {
            saleItems: {
              where: { isDeleted: false }
            },
            selectedCustomer: true,
            paymentMethod: {
              where: { isDeleted: false }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        purchase: {
          where: { isDeleted: false },
          include: {
            purchaseItem: {
              where: { isDeleted: false }
            },
            supplier: true
          },
          orderBy: { createdAt: 'desc' }
        },
        customer: {
          where: { isDeleted: false },
          orderBy: { name: 'asc' }
        },
        supplier: {
          where: { isDeleted: false },
          orderBy: { name: 'asc' }
        }
      }
    });

    // If not found by code, try by id
    if (!warehouse) {
      warehouse = await offlinePrisma.warehouses.findUnique({
        where: {
          id: id,
          isDeleted: false
        },
        include: {
          users: {
            where: { isDeleted: false }
          },
          products: {
            where: { isDeleted: false },
            orderBy: { name: 'asc' }
          },
          sale: {
            where: { isDeleted: false },
            include: {
              saleItems: {
                where: { isDeleted: false }
              },
              selectedCustomer: true,
              paymentMethod: {
                where: { isDeleted: false }
              }
            },
            orderBy: { createdAt: 'desc' }
          },
          purchase: {
            where: { isDeleted: false },
            include: {
              purchaseItem: {
                where: { isDeleted: false }
              },
              supplier: true
            },
            orderBy: { createdAt: 'desc' }
          },
          customer: {
            where: { isDeleted: false },
            orderBy: { name: 'asc' }
          },
          supplier: {
            where: { isDeleted: false },
            orderBy: { name: 'asc' }
          }
        }
      });
    }

    if (!warehouse) {
      return NextResponse.json(
        { error: "Warehouse not found" },
        { status: 404 }
      );
    }

    // Calculate comprehensive statistics
    const totalProducts = warehouse.products.length;
    const lowStockProducts = warehouse.products.filter(p => p.quantity <= 10).length;
    const outOfStockProducts = warehouse.products.filter(p => p.quantity === 0).length;
    const totalSales = warehouse.sale.reduce((sum, sale) => sum + (sale.grandTotal || 0), 0);
    const totalOrders = warehouse.sale.length;
    const totalPurchases = warehouse.purchase.reduce((sum, purchase) => sum + (purchase.grandTotal || 0), 0);
    const assignedUsers = warehouse.users.length;
    const totalCustomers = warehouse.customer.length;
    const totalSuppliers = warehouse.supplier.length;

    // Calculate inventory value
    const totalInventoryValue = warehouse.products.reduce((sum, product) => 
      sum + (product.cost * product.quantity), 0
    );

    // Calculate recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSales = warehouse.sale.filter(sale => 
      new Date(sale.createdAt) >= thirtyDaysAgo
    );
    const recentPurchases = warehouse.purchase.filter(purchase => 
      new Date(purchase.createdAt) >= thirtyDaysAgo
    );

    // Get product categories and their counts
    const productsByUnit = warehouse.products.reduce((acc: any, product) => {
      acc[product.unit] = (acc[product.unit] || 0) + 1;
      return acc;
    }, {});

    // Get top selling products (from sale items)
    const productSales = warehouse.sale.reduce((acc: any, sale) => {
      sale.saleItems.forEach((item: any) => {
        if (!acc[item.productId]) {
          acc[item.productId] = {
            productId: item.productId,
            productName: item.productName,
            totalQuantity: 0,
            totalRevenue: 0
          };
        }
        acc[item.productId].totalQuantity += item.quantity;
        acc[item.productId].totalRevenue += item.total;
      });
      return acc;
    }, {});

    const topProducts = Object.values(productSales)
      .sort((a: any, b: any) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);

    // Get top customers
    const customerSales = warehouse.sale.reduce((acc: any, sale) => {
      if (sale.selectedCustomer) {
        const customerId = sale.selectedCustomer.id;
        if (!acc[customerId]) {
          acc[customerId] = {
            customerId,
            customerName: sale.selectedCustomer.name,
            totalOrders: 0,
            totalSpent: 0
          };
        }
        acc[customerId].totalOrders += 1;
        acc[customerId].totalSpent += sale.grandTotal;
      }
      return acc;
    }, {});

    const topCustomers = Object.values(customerSales)
      .sort((a: any, b: any) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    const response = {
      ...warehouse,
      stats: {
        totalProducts,
        totalSales,
        totalOrders,
        totalPurchases,
        assignedUsers,
        totalCustomers,
        totalSuppliers,
        lowStockProducts,
        outOfStockProducts,
        totalInventoryValue,
        recentSales: recentSales.length,
        recentPurchases: recentPurchases.length
      },
      analytics: {
        productsByUnit,
        topProducts,
        topCustomers,
        recentActivity: {
          sales: recentSales.slice(0, 10),
          purchases: recentPurchases.slice(0, 10)
        }
      }
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching warehouse offline data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await offlinePrisma.$disconnect();
  }
}