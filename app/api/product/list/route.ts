import { NextRequest, NextResponse } from "next/server";
import offlinePrisma from "@/lib/oflinePrisma";

export async function POST(req: NextRequest) {
  try {
    const { warehouseId, page = 1, limit = 50, search = '', sortBy = 'name', sortOrder = 'asc' } = await req.json();

    if (!warehouseId) {
      return NextResponse.json({
        success: false,
        error: "Warehouse ID is required"
      }, { status: 400 });
    }

    const skip = (page - 1) * limit;

    // Build search conditions
    const searchConditions: any = {
      isDeleted: false,
      warehousesId: warehouseId
    };

    if (search) {
      searchConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Build sort conditions
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get products with pagination
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
          syncedAt: true
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
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Product list error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch products"
    }, { status: 500 });
  } finally {
    await offlinePrisma.$disconnect();
  }
}

// For backward compatibility with existing code
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const warehouseId = searchParams.get('warehouseId');
  
  if (!warehouseId) {
    return NextResponse.json({
      success: false,
      error: "Warehouse ID is required"
    }, { status: 400 });
  }

  try {
    const products = await offlinePrisma.product.findMany({
      where: {
        isDeleted: false,
        warehousesId: warehouseId
      },
      orderBy: { name: 'asc' }
    });

    const productsWithStatus = products.map(product => ({
      ...product,
      stockStatus: getStockStatus(product.quantity),
      inventoryValue: product.cost * product.quantity
    }));

    return NextResponse.json(productsWithStatus, { status: 200 });

  } catch (error) {
    console.error("Product list error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch products"
    }, { status: 500 });
  } finally {
    await offlinePrisma.$disconnect();
  }
}

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

