/**
 * Bin (Trash) API Route
 *
 * Handles operations on the deleted events bin:
 * - GET /api/bin - Retrieve all soft-deleted events
 * - DELETE /api/bin - Permanently delete all events in the bin
 *
 * The bin contains events that have been soft-deleted (deletedAt is set).
 * Events in the bin can be restored or permanently deleted.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/bin
 *
 * Retrieves all soft-deleted events for the authenticated user.
 * These are events where deletedAt is not null.
 *
 * Events are sorted by deletedAt in descending order (most recently deleted first).
 *
 * @returns JSON array of deleted event objects
 */
export async function GET() {
  // Get the current user's session
  const session = await getServerSession(authOptions);

  // Require authentication
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Query all deleted events for this user
    const deletedEvents = await prisma.event.findMany({
      where: {
        userId: session.user.id,
        deletedAt: { not: null }, // Only events that have been soft-deleted
      },
      orderBy: {
        deletedAt: "desc", // Most recently deleted first
      },
    });

    return NextResponse.json(deletedEvents);
  } catch (error) {
    console.error("Error fetching bin:", error);
    return NextResponse.json(
      { error: "Failed to fetch bin" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bin
 *
 * Permanently deletes ALL events in the user's bin.
 * This is the "Empty Bin" functionality.
 *
 * WARNING: This action is irreversible. All soft-deleted events
 * will be permanently removed from the database.
 *
 * @returns Success response after emptying the bin
 */
export async function DELETE() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Permanently delete all soft-deleted events for this user
    // Uses deleteMany for efficient batch deletion
    await prisma.event.deleteMany({
      where: {
        userId: session.user.id,
        deletedAt: { not: null }, // Only delete events that are in the bin
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error emptying bin:", error);
    return NextResponse.json(
      { error: "Failed to empty bin" },
      { status: 500 }
    );
  }
}
