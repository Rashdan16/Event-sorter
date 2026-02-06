/**
 * Google Calendar API Route
 *
 * Handles synchronization between our app's events and Google Calendar:
 * - POST /api/calendar - Create an event in the user's Google Calendar
 *
 * This endpoint takes an event from our database and creates a corresponding
 * event in the user's Google Calendar. It handles OAuth token refresh automatically.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createCalendarEvent } from "@/services/calendar-service";

/**
 * Refresh an expired Google OAuth access token
 *
 * OAuth access tokens expire after a short time (usually 1 hour).
 * This function uses the refresh token to obtain a new access token
 * without requiring the user to sign in again.
 *
 * @param account - Object containing account ID and refresh token
 * @returns The new access token
 * @throws Error if refresh fails (user needs to re-authenticate)
 */
async function refreshAccessToken(account: {
  id: string;
  refresh_token: string | null;
}) {
  // Refresh token is required for this operation
  if (!account.refresh_token) {
    throw new Error("No refresh token available");
  }

  // Call Google's OAuth token endpoint to exchange refresh token for new access token
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",      // Indicates we're using refresh token flow
      refresh_token: account.refresh_token,
    }),
  });

  // Parse the response
  const data = await response.json();

  // Handle errors from Google's API
  if (!response.ok) {
    throw new Error(data.error_description || data.error || "Failed to refresh token");
  }

  // Store the new access token in our database for future use
  // Also update the expiration time
  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: data.access_token,
      // Convert expires_in (seconds from now) to absolute Unix timestamp
      expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
    },
  });

  return data.access_token;
}

/**
 * POST /api/calendar
 *
 * Creates an event in the user's Google Calendar.
 *
 * Process:
 * 1. Validate the user is authenticated
 * 2. Fetch the event from our database
 * 3. Get the user's Google OAuth tokens
 * 4. Refresh the access token if expired
 * 5. Create the event in Google Calendar
 * 6. Store the Google Calendar event ID in our database
 *
 * Request body:
 * - eventId: The ID of the event in our database to sync
 *
 * @param request - The incoming HTTP request
 * @returns Success response with Google event details, or error
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // Require authentication
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Extract the event ID from the request body
    const { eventId } = await request.json();

    // Fetch the event from our database
    // Also verify it belongs to the current user
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
        userId: session.user.id,
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get the user's Google account credentials from the database
    // This was saved when the user signed in with Google
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: "google",
      },
    });

    // If no Google account is linked, the user needs to sign in again
    if (!account?.access_token) {
      return NextResponse.json(
        { error: "Google account not connected. Please sign out and sign in again." },
        { status: 400 }
      );
    }

    // Check if the access token is expired or about to expire
    let accessToken = account.access_token;
    const now = Math.floor(Date.now() / 1000);  // Current time in seconds
    const expiresAt = account.expires_at || 0;   // Token expiration time

    // Refresh if expired or expiring within 5 minutes (300 seconds)
    if (!expiresAt || expiresAt - now < 300) {
      try {
        // Get a fresh access token using the refresh token
        accessToken = await refreshAccessToken({
          id: account.id,
          refresh_token: account.refresh_token,
        });
      } catch (refreshError) {
        // If refresh fails, user needs to re-authenticate
        const errorMsg = refreshError instanceof Error ? refreshError.message : "Token refresh failed";
        return NextResponse.json(
          { error: errorMsg + ". Please sign out and sign in again." },
          { status: 401 }
        );
      }
    }

    // Create the event in Google Calendar using our calendar service
    const calendarResult = await createCalendarEvent(accessToken, {
      name: event.name,
      description: event.description || undefined,
      location: event.location || undefined,
      // Convert Date to YYYY-MM-DD string format
      date: event.date.toISOString().split("T")[0],
      time: event.time || undefined,
    });

    // Save the Google Calendar event ID in our database
    // This links our event to the Google Calendar event for future updates/deletion
    await prisma.event.update({
      where: { id: eventId },
      data: { googleEventId: calendarResult.id },
    });

    // Return success with the Google Calendar event details
    return NextResponse.json({
      success: true,
      googleEventId: calendarResult.id,
      htmlLink: calendarResult.htmlLink,  // URL to view in Google Calendar
    });
  } catch (error) {
    console.error("Error creating calendar event:", error);

    // Provide user-friendly error messages for common issues
    let errorMessage = "Failed to create calendar event";

    if (error instanceof Error) {
      if (error.message.includes("invalid_grant")) {
        // OAuth grant is invalid - token was revoked or expired
        errorMessage = "Session expired. Please sign out and sign in again.";
      } else if (error.message.includes("insufficient")) {
        // User didn't grant calendar permissions during sign-in
        errorMessage = "Calendar permission not granted. Please sign out and sign in again.";
      } else if (error.message.includes("401") || error.message.includes("403")) {
        // General authorization failures
        errorMessage = "Not authorized. Please sign out and sign in again.";
      } else {
        // Use the actual error message for other cases
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
