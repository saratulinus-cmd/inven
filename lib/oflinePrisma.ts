// lib/prisma.ts
import { PrismaClient } from "@/prisma/generated/offline";

declare global {
  // This allows reuse of the PrismaClient instance in development
  var offlinePrisma: PrismaClient | undefined;
}

const offlinePrisma = globalThis.offlinePrisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
});

if (process.env.NODE_ENV !== "production") globalThis.offlinePrisma = offlinePrisma;

// Ensure connection on startup
async function ensureConnection() {
  try {
    await offlinePrisma.$connect();
    console.log("Offline Prisma client connected successfully");
  } catch (error) {
    console.error("Failed to connect offline Prisma client:", error);
  }
}

// Auto-connect when module is imported
ensureConnection();

// Graceful shutdown
process.on('beforeExit', async () => {
  await offlinePrisma.$disconnect();
});

export default offlinePrisma;
