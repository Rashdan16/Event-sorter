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
 * GET /api/events
 *
 * Retrieves all active (non-deleted) events for the authenticated user.
 * Events are sorted by date in ascending order (earliest first).
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
        endDate: data.endDate ? new Date(data.endDate) : null,
        time: data.time,
        ticketUrl: data.ticketUrl,
        price: data.price,
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
