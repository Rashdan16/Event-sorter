/**
 * Events API Route
 *
 * Handles the main events collection endpoints:
 * - GET /api/events - Retrieve all events for the authenticated user
 * - POST /api/events - Create a new event
 *
 * All endpoints require authentication via NextAuth session.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * Background Cleanup Function
 *
 * Automatically removes events that have passed more than 1 hour ago.
 * This keeps the user's event list clean by removing outdated events.
 *
 * Runs silently in the background when events are fetched (non-blocking).
 *
 * @param userId - The ID of the user whose events should be cleaned up
 */
async function cleanupExpiredEvents(userId: string) {
  const now = new Date();

  // Query all non-deleted events for this user that might be expired
  // We filter by date <= now to only check events that could potentially be expired
  const events = await prisma.event.findMany({
    where: {
      userId,
      deletedAt: null, // Don't clean up already-deleted events
      date: {
        lte: now, // Only events on or before today
      },
    },
    select: {
      id: true,
      date: true,
      time: true,
    },
  });

  // Array to collect IDs of events that should be deleted
  const expiredEventIds: string[] = [];

  // Check each potential expired event
  for (const event of events) {
    // Start with the event's date
    const eventDateTime = new Date(event.date);

    if (event.time) {
      // If the event has a specific time, use it
      // Parse "HH:MM" format and set hours/minutes on the date
      const [hours, minutes] = event.time.split(":").map(Number);
      eventDateTime.setHours(hours, minutes, 0, 0);
    } else {
      // For all-day events (no specific time), set to end of day
      // This ensures all-day events aren't deleted until the day is over
      eventDateTime.setHours(23, 59, 0, 0);
    }

    // Calculate expiry time: event time + 1 hour grace period
    // Events are kept for 1 hour after they end
    const expiryTime = new Date(eventDateTime.getTime() + 60 * 60 * 1000);

    // If current time is past the expiry time, mark for deletion
    if (now >= expiryTime) {
      expiredEventIds.push(event.id);
    }
  }

  // Batch delete all expired events in a single database operation
  if (expiredEventIds.length > 0) {
    await prisma.event.deleteMany({
      where: {
        id: {
          in: expiredEventIds,
        },
      },
    });
    // Log for debugging/monitoring purposes
    console.log(`Auto-cleanup: Deleted ${expiredEventIds.length} expired event(s)`);
  }
}

/**
 * GET /api/events
 *
 * Retrieves all active (non-deleted) events for the authenticated user.
 * Events are sorted by date in ascending order (earliest first).
 *
 * Also triggers background cleanup of expired events.
 *
 * @returns JSON array of event objects, or error response
 */
export async function GET() {
  // Get the current user's session
  const session = await getServerSession(authOptions);

  // Require authentication - return 401 if not logged in
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Trigger cleanup in background (fire-and-forget)
    // Using .catch() prevents unhandled promise rejections
    // Don't await - this runs asynchronously to not slow down the response
    cleanupExpiredEvents(session.user.id).catch((err) =>
      console.error("Cleanup error:", err)
    );

    // Fetch all active events for this user
    const events = await prisma.event.findMany({
      where: {
        userId: session.user.id, // Only this user's events
        deletedAt: null,         // Exclude soft-deleted events
      },
      orderBy: {
        date: "asc", // Sort by date, earliest first
      },
    });

    // Return events as JSON
    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/events
 *
 * Creates a new event for the authenticated user.
 *
 * Request body should contain:
 * - name (required): Event title
 * - description (optional): Event description
 * - location (optional): Event venue/location
 * - date (required): Event date in YYYY-MM-DD format
 * - time (optional): Event time in HH:MM format
 * - ticketUrl (optional): URL for tickets
 * - imageUrl (optional): URL of the uploaded poster image
 *
 * @param request - The incoming HTTP request with event data in body
 * @returns The created event object, or error response
 */
export async function POST(request: NextRequest) {
  // Get the current user's session
  const session = await getServerSession(authOptions);

  // Require authentication
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse the request body as JSON
    const data = await request.json();

    // Create the event in the database
    const event = await prisma.event.create({
      data: {
        name: data.name,
        description: data.description,
        location: data.location,
        date: new Date(data.date), // Convert string date to Date object
        time: data.time,
        ticketUrl: data.ticketUrl,
        imageUrl: data.imageUrl,
        userId: session.user.id, // Associate with the current user
      },
    });

    // Return the created event
    return NextResponse.json(event);
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
