import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createCalendarEvent } from "@/services/calendar-service";

async function refreshAccessToken(account: {
  id: string;
  refresh_token: string | null;
}) {
  if (!account.refresh_token) {
    throw new Error("No refresh token available");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: account.refresh_token,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error_description || data.error || "Failed to refresh token");
  }

  // Update the access token in the database
  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: data.access_token,
      expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
    },
  });

  return data.access_token;
}

// POST /api/calendar - Create a Google Calendar event
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { eventId } = await request.json();

    // Get the event from database
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
        userId: session.user.id,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get the user's Google account with access token
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: "google",
      },
    });

    if (!account?.access_token) {
      return NextResponse.json(
        { error: "Google account not connected. Please sign out and sign in again." },
        { status: 400 }
      );
    }

    // Check if token is expired or about to expire (within 5 minutes)
    let accessToken = account.access_token;
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = account.expires_at || 0;

    if (!expiresAt || expiresAt - now < 300) {
      // Token expired or expiring soon, refresh it
      try {
        accessToken = await refreshAccessToken({
          id: account.id,
          refresh_token: account.refresh_token,
        });
      } catch (refreshError) {
        const errorMsg = refreshError instanceof Error ? refreshError.message : "Token refresh failed";
        return NextResponse.json(
          { error: errorMsg + ". Please sign out and sign in again." },
          { status: 401 }
        );
      }
    }

    // Create calendar event
    const calendarResult = await createCalendarEvent(accessToken, {
      name: event.name,
      description: event.description || undefined,
      location: event.location || undefined,
      date: event.date.toISOString().split("T")[0],
      time: event.time || undefined,
    });

    // Update event with Google Calendar ID
    await prisma.event.update({
      where: { id: eventId },
      data: { googleEventId: calendarResult.id },
    });

    return NextResponse.json({
      success: true,
      googleEventId: calendarResult.id,
      htmlLink: calendarResult.htmlLink,
    });
  } catch (error) {
    console.error("Error creating calendar event:", error);

    let errorMessage = "Failed to create calendar event";

    if (error instanceof Error) {
      if (error.message.includes("invalid_grant")) {
        errorMessage = "Session expired. Please sign out and sign in again.";
      } else if (error.message.includes("insufficient")) {
        errorMessage = "Calendar permission not granted. Please sign out and sign in again.";
      } else if (error.message.includes("401") || error.message.includes("403")) {
        errorMessage = "Not authorized. Please sign out and sign in again.";
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
