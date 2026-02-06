import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * Automatically deletes events that have passed more than 1 hour ago.
 * Runs silently in the background when events are fetched.
 */
async function cleanupExpiredEvents(userId: string) {
  const now = new Date();

  // Get all events for this user that might be expired
  const events = await prisma.event.findMany({
    where: {
      userId,
      date: {
        lte: now,
      },
    },
    select: {
      id: true,
      date: true,
      time: true,
    },
  });

  const expiredEventIds: string[] = [];

  for (const event of events) {
    const eventDateTime = new Date(event.date);

    if (event.time) {
      const [hours, minutes] = event.time.split(":").map(Number);
      eventDateTime.setHours(hours, minutes, 0, 0);
    } else {
      // For all-day events, set to end of day
      eventDateTime.setHours(23, 59, 0, 0);
    }

    // Add 1 hour to get expiry time
    const expiryTime = new Date(eventDateTime.getTime() + 60 * 60 * 1000);

    if (now >= expiryTime) {
      expiredEventIds.push(event.id);
    }
  }

  // Delete expired events
  if (expiredEventIds.length > 0) {
    await prisma.event.deleteMany({
      where: {
        id: {
          in: expiredEventIds,
        },
      },
    });
    console.log(`Auto-cleanup: Deleted ${expiredEventIds.length} expired event(s)`);
  }
}

// GET /api/events - Get all events for the current user
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Run cleanup in the background (don't await to avoid slowing down response)
    cleanupExpiredEvents(session.user.id).catch((err) =>
      console.error("Cleanup error:", err)
    );

    const events = await prisma.event.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        date: "asc",
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

// POST /api/events - Create a new event
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();

    const event = await prisma.event.create({
      data: {
        name: data.name,
        description: data.description,
        location: data.location,
        date: new Date(data.date),
        time: data.time,
        ticketUrl: data.ticketUrl,
        imageUrl: data.imageUrl,
        userId: session.user.id,
      },
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
