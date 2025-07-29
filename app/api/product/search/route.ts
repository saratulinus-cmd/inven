import { NextRequest, NextResponse } from "next/server";
import offlinePrisma from "@/lib/oflinePrisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const warehouseId = searchParams.get('warehouseId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const skip = (page - 1) * limit;

    // Build search conditions
    const searchConditions: any = {
      isDeleted: false,
    };

    if (warehouseId) {
      searchConditions.warehousesId = warehouseId;
    }

    if (query) {
      searchConditions.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { barcode: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ];
    }

    // Build sort conditions
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Execute search with pagination
    const [products, totalCount] = await Promise.all([
      offlinePrisma.product.findMany({
        where: searchConditions,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          barcode: true,
          quantity: true,
          unit: true,
          cost: true,
          wholeSalePrice: true,
          retailPrice: true,
          taxRate: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          sync: true,
          syncedAt: true,
          warehousesId: true,
          warehouses: {
            select: {
              name: true,
              warehouseCode: true
            }
          }
        }
      }),
      offlinePrisma.product.count({
        where: searchConditions
      })
    ]);

    // Add stock status to each product
    const productsWithStatus = products.map(product => ({
      ...product,
      stockStatus: getStockStatus(product.quantity),
      inventoryValue: product.cost * product.quantity
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: productsWithStatus,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      meta: {
        query,
        warehouseId,
        sortBy,
        sortOrder
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Product search error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to search products"
    }, { status: 500 });
  } finally {
    await offlinePrisma.$disconnect();
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      query = '',
      warehouseId,
      page = 1,
      limit = 50,
      sortBy = 'name',
      sortOrder = 'asc',
      filters = {}
    } = body;

    const skip = (page - 1) * limit;

    // Build search conditions
    const searchConditions: any = {
      isDeleted: false,
    };

    if (warehouseId) {
      searchConditions.warehousesId = warehouseId;
    }

    if (query) {
      searchConditions.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { barcode: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ];
    }

    // Apply additional filters
    if (filters.stockStatus) {
      switch (filters.stockStatus) {
        case 'low':
          searchConditions.quantity = { lte: 10, gt: 0 };
          break;
        case 'out':
          searchConditions.quantity = 0;
          break;
        case 'good':
          searchConditions.quantity = { gt: 10 };
          break;
      }
    }

    if (filters.unit) {
      searchConditions.unit = filters.unit;
    }

    if (filters.priceRange) {
      if (filters.priceRange.min !== undefined) {
        searchConditions.retailPrice = { ...searchConditions.retailPrice, gte: filters.priceRange.min };
      }
      if (filters.priceRange.max !== undefined) {
        searchConditions.retailPrice = { ...searchConditions.retailPrice, lte: filters.priceRange.max };
      }
    }

    // Build sort conditions
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Execute search with pagination
    const [products, totalCount] = await Promise.all([
      offlinePrisma.product.findMany({
        where: searchConditions,
        orderBy,
        skip,
        take: limit,
        include: {
          warehouses: {
            select: {
              name: true,
              warehouseCode: true
            }
          }
        }
      }),
      offlinePrisma.product.count({
        where: searchConditions
      })
    ]);

    // Add stock status and additional calculations
    const productsWithStatus = products.map(product => ({
      ...product,
      stockStatus: getStockStatus(product.quantity),
      inventoryValue: product.cost * product.quantity,
      profitMargin: ((product.retailPrice - product.cost) / product.cost * 100).toFixed(2)
    }));

    const totalPages = Math.ceil(totalCount / limit);

    // Calculate aggregations
    const totalInventoryValue = productsWithStatus.reduce((sum, p) => sum + p.inventoryValue, 0);
    const lowStockCount = productsWithStatus.filter(p => p.quantity <= 10 && p.quantity > 0).length;
    const outOfStockCount = productsWithStatus.filter(p => p.quantity === 0).length;

    return NextResponse.json({
      success: true,
      data: productsWithStatus,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      aggregations: {
        totalInventoryValue,
        lowStockCount,
        outOfStockCount
      },
      meta: {
        query,
        warehouseId,
        sortBy,
        sortOrder,
        filters
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Advanced product search error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to search products"
    }, { status: 500 });
  } finally {
    await offlinePrisma.$disconnect();
  }
}

// Helper function to determine stock status
function getStockStatus(quantity: number) {
  if (quantity === 0) {
    return {
      status: 'Out of Stock',
      color: 'text-red-600',
      bg: 'bg-red-100',
      level: 'critical'
    };
  } else if (quantity <= 10) {
    return {
      status: 'Low Stock',
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
      level: 'warning'
    };
  } else {
    return {
      status: 'In Stock',
      color: 'text-green-600',
      bg: 'bg-green-100',
      level: 'good'
    };
  }
}