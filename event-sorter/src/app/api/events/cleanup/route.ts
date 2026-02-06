import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Deletes events that have passed more than 1 hour ago.
 * For events with a specific time, it calculates the exact end time.
 * For all-day events (no time), it deletes 1 hour after midnight of the event date.
 */
async function deleteExpiredEvents() {
  const now = new Date();

  // Get all events that might be expired
  const events = await prisma.event.findMany({
    where: {
      date: {
        lte: now, // Event date is today or earlier
      },
    },
    select: {
      id: true,
      date: true,
      time: true,
      googleEventId: true,
      userId: true,
    },
  });

  const expiredEventIds: string[] = [];

  for (const event of events) {
    const eventDateTime = new Date(event.date);

    // If the event has a specific time, use it
    if (event.time) {
      const [hours, minutes] = event.time.split(":").map(Number);
      eventDateTime.setHours(hours, minutes, 0, 0);
    } else {
      // For all-day events, set to end of day (23:59)
      eventDateTime.setHours(23, 59, 0, 0);
    }

    // Add 1 hour to get the expiry time
    const expiryTime = new Date(eventDateTime.getTime() + 60 * 60 * 1000);

    // If current time is past the expiry time, mark for deletion
    if (now >= expiryTime) {
      expiredEventIds.push(event.id);
    }
  }

  // Delete all expired events
  if (expiredEventIds.length > 0) {
    const result = await prisma.event.deleteMany({
      where: {
        id: {
          in: expiredEventIds,
        },
      },
    });

    return {
      deleted: result.count,
      eventIds: expiredEventIds,
    };
  }

  return { deleted: 0, eventIds: [] };
}

// GET /api/events/cleanup - Manual trigger for cleanup (can be used with cron)
export async function GET() {
  try {
    const result = await deleteExpiredEvents();

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${result.deleted} expired event(s)`,
      ...result,
    });
  } catch (error) {
    console.error("Error during event cleanup:", error);
    return NextResponse.json(
      { error: "Failed to cleanup events" },
      { status: 500 }
    );
  }
}

// POST /api/events/cleanup - Alternative trigger method
export async function POST() {
  return GET();
}

// Export the cleanup function for use in other routes
export { deleteExpiredEvents };
