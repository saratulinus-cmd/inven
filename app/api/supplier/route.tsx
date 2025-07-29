import { NextRequest, NextResponse } from "next/server";
import offlinePrisma from "@/lib/oflinePrisma";
import { markSupplierAsUnsynced } from "@/lib/sync-helpers";

export async function GET(req: NextRequest) {
    try {
        const suppliers = await offlinePrisma.supplier.findMany({
            where: { isDeleted: false }
        });
        
        return NextResponse.json(suppliers, { status: 200 });
    } catch (error) {
        console.error("Supplier fetch error:", error);
        return NextResponse.json(error, { status: 500 });
    } finally {
        await offlinePrisma.$disconnect();
    }
}

export async function POST(req:NextRequest){
    const {
        address,      
        companyName,
        email,      
        name,       
        phone,       
        type,       
        warehousesId
    } = await req.json()

    try {
        const supplier = await offlinePrisma.supplier.create({
            data:{
                address,
                companyName,
                email,
                name,
                phone,
                type,
                warehousesId,
                sync: false, // New suppliers should be marked as unsynced
                syncedAt: null
            }
        })

        console.log(`New supplier created: ${supplier.id} - marked as unsynced`);

        return NextResponse.json({
            message: "Supplier created successfully",
            supplier
        }, {status:201})
        
    } catch (error) {
        console.error("Supplier creation error:", error);
        return NextResponse.json(error, {status:500})
    } finally {
        await offlinePrisma.$disconnect();
    }
}

export async function PUT(req: NextRequest) {
    const {
        supplierId,
        address,
        companyName,
        email,
        name,
        phone,
        type
    } = await req.json();

    try {
        // Check if supplier exists
        const existingSupplier = await offlinePrisma.supplier.findUnique({
            where: { id: supplierId, isDeleted: false }
        });

        if (!existingSupplier) {
            return NextResponse.json("Supplier does not exist", { status: 404 });
        }

        // Update the supplier
        const updatedSupplier = await offlinePrisma.supplier.update({
            where: { id: supplierId },
            data: {
                address,
                companyName,
                email,
                name,
                phone,
                type,
                sync: false, // Mark as unsynced since it was updated
                syncedAt: null,
                updatedAt: new Date()
            }
        });

        console.log(`Supplier updated: ${supplierId} - marked as unsynced`);

        return NextResponse.json({
            message: "Supplier updated successfully",
            supplier: updatedSupplier
        }, { status: 200 });
    } catch (error) {
        console.error("Supplier update error:", error);
        return NextResponse.json(error, { status: 500 });
    } finally {
        await offlinePrisma.$disconnect();
    }
}

export async function DELETE(req: NextRequest) {
    const { supplierId } = await req.json();

    try {
        const supplier = await offlinePrisma.supplier.findUnique({
            where: { id: supplierId }
        });

        if (!supplier) {
            return NextResponse.json("Supplier does not exist", { status: 404 });
        }

        const deletedSupplier = await offlinePrisma.supplier.update({
            where: { id: supplierId },
            data: {
                isDeleted: true,
                sync: false, // Mark as unsynced to sync the deletion
                syncedAt: null,
                updatedAt: new Date()
            }
        });

        console.log(`Supplier deleted: ${supplierId} - marked as unsynced for deletion sync`);

        return NextResponse.json({
            message: "Supplier deleted successfully",
            supplier: deletedSupplier
        }, { status: 200 });
    } catch (error) {
        console.error("Supplier deletion error:", error);
        return NextResponse.json(error, { status: 500 });
    } finally {
        await offlinePrisma.$disconnect();
    }
}