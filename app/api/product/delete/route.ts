import { NextRequest, NextResponse } from "next/server";
import offlinePrisma from "@/lib/oflinePrisma";

export async function POST(req: NextRequest) {
  try {
    const { productId } = await req.json();

    if (!productId) {
      return NextResponse.json({
        success: false,
        error: "Product ID is required"
      }, { status: 400 });
    }

    // Check if product exists
    const product = await offlinePrisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return NextResponse.json({
        success: false,
        error: "Product not found"
      }, { status: 404 });
    }

    // Soft delete the product and mark as unsynced
    const deletedProduct = await offlinePrisma.product.update({
      where: { id: productId },
      data: {
        isDeleted: true,
        sync: false, // Mark as unsynced to sync the deletion
        syncedAt: null,
        updatedAt: new Date()
      }
    });

    console.log(`Product deleted: ${productId} - marked as unsynced for deletion sync`);

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
      product: deletedProduct
    }, { status: 200 });

  } catch (error) {
    console.error("Product deletion error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to delete product"
    }, { status: 500 });
  } finally {
    await offlinePrisma.$disconnect();
  }
}