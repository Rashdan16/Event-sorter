/**
 * Single Bin Item API Route
 *
 * Handles operations on individual items in the bin:
 * - POST /api/bin/[id] - Restore an event from the bin
 * - DELETE /api/bin/[id] - Permanently delete an event from the bin
 *
 * These operations only work on soft-deleted events (events in the bin).
 * Attempting to operate on non-deleted events will return 404.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * POST /api/bin/[id]
 *
 * Restores a soft-deleted event from the bin back to the active events list.
 * This clears the deletedAt timestamp, making the event visible again.
 *
 * Validation:
 * - Event must exist
 * - Event must belong to the authenticated user
 * - Event must be in the bin (deletedAt must be set)
 *
 * @param request - The incoming HTTP request
 * @param params - Contains the event ID from the URL path
 * @returns The restored event object, or error response
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Get current user session
  const session = await getServerSession(authOptions);

  // Extract event ID from URL params
  const { id } = await params;

  // Require authentication
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find the event in the database
    const existing = await prisma.event.findUnique({
      where: { id },
    });

    // Validate the event can be restored:
    // - Must exist
    // - Must belong to this user
    // - Must be in the bin (deletedAt is set)
    if (!existing || existing.userId !== session.user.id || !existing.deletedAt) {
      return NextResponse.json({ error: "Event not found in bin" }, { status: 404 });
    }

    // RESTORE: Clear the deletedAt timestamp
    // This makes the event visible in the regular events list again
    const event = await prisma.event.update({
      where: { id },
      data: { deletedAt: null },
    });

    // Return the restored event
    return NextResponse.json(event);
  } catch (error) {
    console.error("Error restoring event:", error);
    return NextResponse.json(
      { error: "Failed to restore event" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bin/[id]
 *
 * Permanently deletes a single event from the bin.
 * Unlike soft-delete, this completely removes the event from the database.
 *
 * WARNING: This action is irreversible!
 *
 * Validation:
 * - Event must exist
 * - Event must belong to the authenticated user
 * - Event must be in the bin (prevents accidental permanent deletion of active events)
 *
 * @param request - The incoming HTTP request
 * @param params - Contains the event ID from the URL path
 * @returns Success response, or error response
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find the event
    const existing = await prisma.event.findUnique({
      where: { id },
    });

    // Validate the event can be permanently deleted:
    // - Must exist
    // - Must belong to this user
    // - Must be in the bin (safety check - can't permanently delete active events)
    if (!existing || existing.userId !== session.user.id || !existing.deletedAt) {
      return NextResponse.json({ error: "Event not found in bin" }, { status: 404 });
    }

    // PERMANENT DELETE: Remove the record from the database entirely
    // This cannot be undone!
    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error permanently deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
