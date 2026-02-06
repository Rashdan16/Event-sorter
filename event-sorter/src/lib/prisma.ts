/**
 * Prisma Database Client Configuration
 *
 * This file sets up a singleton Prisma client instance to connect to the PostgreSQL database.
 * Using a singleton pattern prevents multiple database connections during development
 * when Next.js hot-reloads the application.
 */

import { PrismaClient } from "@prisma/client";

/**
 * Extend the global object to store the Prisma client instance.
 * This allows us to reuse the same connection across hot reloads in development.
 * TypeScript requires us to cast globalThis to include our custom prisma property.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Create or reuse the Prisma client instance.
 * - If a client already exists on the global object, reuse it
 * - Otherwise, create a new PrismaClient instance
 *
 * The ?? operator (nullish coalescing) returns the right-hand value
 * only if the left-hand value is null or undefined.
 */
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

/**
 * In development mode, store the Prisma client on the global object.
 * This prevents creating new connections on every hot reload.
 * In production, we skip this since the app doesn't hot reload.
 */
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Export the prisma client as the default export for easy importing
export default prisma;
