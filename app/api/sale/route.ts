import { NextRequest, NextResponse } from "next/server";
import offlinePrisma from "@/lib/oflinePrisma";
import { markRelatedRecordsAsUnsynced } from "@/lib/sync-helpers";

export async function POST(req:NextRequest){
    const {
        items,
        invoiceNo,
        subtotal,
        totalDiscount,
        taxRate,
        taxAmount,
        grandTotal,
        paymentMethods,
        amountPaid,
        balance,
        notes,
        cashier,
        warehouseId,
        customer
    } = await req.json()

   try {
    const warehouse = await offlinePrisma.warehouses.findUnique({where:{warehouseCode:warehouseId,isDeleted:false}})
            
    if(!warehouse) return NextResponse.json("werehous does not exisi",{status:401})

    // Create the sale with sync: false
    const sale = await offlinePrisma.sale.create({
        data:{
            invoiceNo,
            subTotal:subtotal,
            taxRate,
            notes,
            amountPaid,
            grandTotal,
            paidAmount:grandTotal - balance,
            balance,
            warehousesId:warehouseId,
            selectedCustomerId:customer.id,
            sync: false, // New sales should be marked as unsynced
            syncedAt: null
        }
    })

    // Validate quantities before processing
    for(let j = 0; j < items.length; j++){
        if(items[j].quantity < 0){
            return NextResponse.json("Invalid quantity",{status:500})
        }
    }

    const saleItemIds: string[] = [];
    const productIds: string[] = [];
    
    // Create sale items and update product quantities
    for (let i = 0; i < items.length; i++) {
        const saleItem = await offlinePrisma.saleItem.create({
            data:{
                saleId:sale.invoiceNo,
                productName:items[i].productName,
                productId:items[i].productId,
                cost:items[i].costPrice,
                selectedPrice:items[i].salePrice,
                priceType:items[i].priceType,
                quantity:items[i].quantity,
                discount:items[i].discount,
                total:items[i].total,
                warehousesId:warehouseId,
                profit:items[i].profit,
                customerId:customer.id,
                sync: false, // New sale items should be marked as unsynced
                syncedAt: null
            }
        })
        
        saleItemIds.push(saleItem.id);
        productIds.push(items[i].productId);
        
        console.log(`Processing product: ${items[i].productId}`);
        
        // Update product quantity and mark as unsynced
        await offlinePrisma.product.update({
            where:{id:items[i].productId, isDeleted:false},
            data:{
                quantity:{
                    decrement:items[i].quantity,
                },
                sync: false, // Product quantity changed, needs sync
                syncedAt: null,
                updatedAt: new Date()
            }
        })
    }

    const paymentMethodIds: string[] = [];
    
    // Create payment methods
    for (let j = 0; j < paymentMethods.length; j++) {
        const paymentMethod = await offlinePrisma.paymentMethod.create({
            data:{
                method:paymentMethods[j].method,
                amount:paymentMethods[j].amount,
                warehousesId:warehouseId,
                saleId:sale.invoiceNo,
                sync: false, // New payment methods should be marked as unsynced
                syncedAt: null
            }
        })
        
        paymentMethodIds.push(paymentMethod.id);
    }

    // Use the sync helper to mark all related records as unsynced
    await markRelatedRecordsAsUnsynced({
        type: 'sale',
        entityId: sale.invoiceNo,
        relatedIds: {
            productIds,
            customerId: customer.id,
            saleItemIds,
            paymentMethodIds
        }
    });

    console.log(`Sale created: ${sale.invoiceNo} with ${items.length} items - all related records marked as unsynced`);
    
    return NextResponse.json({
        message: "Sale created successfully",
        saleId: sale.invoiceNo,
        unsyncedRecords: {
            sale: 1,
            saleItems: saleItemIds.length,
            products: productIds.length,
            paymentMethods: paymentMethodIds.length,
            customer: customer.id ? 1 : 0
        }
    })
   } catch (error) {
    console.error("Sale creation error:", error)
    return NextResponse.json(error,{status:500})
   } finally {
    await offlinePrisma.$disconnect()
   }
}

export async function DELETE(req:NextRequest){
    const {saleId} = await req.json()
    try {
        const findSale = await offlinePrisma.sale.findFirst({
            where:{invoiceNo:saleId, isDeleted:false},
            include: {
                saleItems: true,
                paymentMethod: true
            }
        })
        
        if(!findSale){
            return NextResponse.json("Sale not found",{status:404})
        }

        // Get related IDs for sync tracking
        const saleItemIds = findSale.saleItems.map(item => item.id);
        const paymentMethodIds = findSale.paymentMethod.map(pm => pm.id);
        const productIds = findSale.saleItems.map(item => item.productId).filter(Boolean) as string[];

        // Restore product quantities before marking sale as deleted
        for (const saleItem of findSale.saleItems) {
            if (saleItem.productId) {
                await offlinePrisma.product.update({
                    where: { id: saleItem.productId },
                    data: {
                        quantity: {
                            increment: saleItem.quantity // Restore the quantity
                        },
                        sync: false, // Product quantity changed, needs sync
                        syncedAt: null,
                        updatedAt: new Date()
                    }
                });
            }
        }

        // Mark sale as deleted and unsynced
        await offlinePrisma.sale.update({
            where:{invoiceNo:saleId},
            data:{
                isDeleted:true,
                sync: false, // Deletion needs to be synced
                syncedAt: null,
                updatedAt: new Date()
            }
        })

        // Mark related sale items as deleted and unsynced
        await offlinePrisma.saleItem.updateMany({
            where: { saleId: saleId },
            data: {
                isDeleted: true,
                sync: false,
                syncedAt: null,
                updatedAt: new Date()
            }
        });

        // Mark related payment methods as deleted and unsynced
        await offlinePrisma.paymentMethod.updateMany({
            where: { saleId: saleId },
            data: {
                isDeleted: true,
                sync: false,
                syncedAt: null,
                updatedAt: new Date()
            }
        });

        console.log(`Sale deleted: ${saleId} - all related records marked as unsynced for deletion sync`);

        return NextResponse.json({
            message: "Sale deleted successfully",
            saleId,
            restoredProducts: productIds.length,
            deletedSaleItems: saleItemIds.length,
            deletedPaymentMethods: paymentMethodIds.length
        }, {status:200})

    } catch (error) {
        console.error("Sale deletion error:", error);
        return NextResponse.json(error,{status:500})
    } finally {
        await offlinePrisma.$disconnect()
    }
}