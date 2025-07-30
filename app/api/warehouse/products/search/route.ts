import { NextRequest, NextResponse } from "next/server";
import onlinePrisma from "@/lib/onlinePrisma";

export async function POST(req: NextRequest) {
  try {
    const { warehouseId, searchTerm, limit = 20 } = await req.json();

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

    // Build search query
    const whereClause: any = {
      warehouses_onlineId: warehouse.warehouseCode,
      isDeleted: false
    };

    if (searchTerm && searchTerm.trim()) {
      whereClause.OR = [
        {
          name: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        {
          barcode: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        }
      ];
    }

    const products = await onlinePrisma.product_online.findMany({
      where: whereClause,
      take: parseInt(limit),
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      products,
      total: products.length,
      warehouse: {
        id: warehouse.id,
        warehouseCode: warehouse.warehouseCode,
        name: warehouse.name
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error searching products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await onlinePrisma.$disconnect();
  }
}