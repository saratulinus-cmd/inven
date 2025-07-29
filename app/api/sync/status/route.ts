import { NextRequest, NextResponse } from "next/server";
import { getUnsyncedCounts } from "@/lib/sync-helpers";

export async function GET(req: NextRequest) {
    try {
        const unsyncedCounts = await getUnsyncedCounts();
        
        return NextResponse.json({
            success: true,
            data: unsyncedCounts,
            message: `${unsyncedCounts.total} records need syncing`
        }, { status: 200 });
    } catch (error) {
        console.error("Failed to get sync status:", error);
        
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            message: "Failed to get sync status"
        }, { status: 500 });
    }
}