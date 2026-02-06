/**
 * Single Event API Route
 *
 * Handles operations on individual events:
 * - GET /api/events/[id] - Retrieve a specific event
 * - PUT /api/events/[id] - Update an event
 * - DELETE /api/events/[id] - Soft delete an event (move to bin)
 *
 * The [id] in the path is a dynamic segment that captures the event ID.
 * All endpoints require authentication and verify event ownership.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/events/[id]
 *
 * Retrieves a single event by its ID.
 * Only returns the event if it belongs to the authenticated user
 * and hasn't been soft-deleted.
 *
 * @param request - The incoming HTTP request
 * @param params - Contains the event ID from the URL path
 * @returns The event object, or 404 if not found
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Get current user session
  const session = await getServerSession(authOptions);

  // Extract the event ID from URL params (Next.js 15+ uses Promise)
  const { id } = await params;

  // Require authentication
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Query the event with multiple conditions:
    // - Matches the ID
    // - Belongs to this user
    // - Not soft-deleted (deletedAt is null)
    const event = await prisma.event.findUnique({
      where: {
        id,
        userId: session.user.id,
        deletedAt: null,
      },
    });

    // Return 404 if event doesn't exist or doesn't belong to user
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/events/[id]
 *
 * Updates an existing event with new data.
 * Verifies ownership before allowing the update.
 *
 * Request body can contain any of:
 * - name, description, location, date, time, ticketUrl, imageUrl, googleEventId
 *
 * @param request - The incoming HTTP request with update data in body
 * @param params - Contains the event ID from the URL path
 * @returns The updated event object, or error response
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse the update data from request body
    const data = await request.json();

    // First, verify that the event exists and belongs to this user
    // This is a security check to prevent users from updating others' events
    const existing = await prisma.event.findUnique({
      where: { id },
    });

    // Return 404 if event doesn't exist or user doesn't own it
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Perform the update with all provided fields
    const event = await prisma.event.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        location: data.location,
        date: new Date(data.date),
        time: data.time,
        ticketUrl: data.ticketUrl,
        imageUrl: data.imageUrl,
        googleEventId: data.googleEventId, // Google Calendar event ID if synced
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/events/[id]
 *
 * Soft-deletes an event by setting its deletedAt timestamp.
 * The event is not permanently removed - it moves to the "bin"
 * and can be restored later.
 *
 * Verifies ownership before allowing deletion.
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
    // Verify the event exists and belongs to this user
    const existing = await prisma.event.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // SOFT DELETE: Instead of removing the record, set deletedAt timestamp
    // This preserves the data and allows for restoration from the bin
    await prisma.event.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}
