/**
 * Google Calendar Integration Service
 *
 * This service handles creating and deleting events in a user's Google Calendar.
 * It uses the Google Calendar API v3 with OAuth2 authentication.
 *
 * The user's access token (obtained during Google sign-in) is required to
 * make API calls on their behalf.
 */

import { google } from "googleapis";

/**
 * Input data structure for creating a calendar event
 * Contains the event details to be added to Google Calendar
 */
interface CalendarEventInput {
  name: string;          // Event title/summary
  description?: string;  // Optional event description
  location?: string;     // Optional venue/location
  date: string;         // Event date in YYYY-MM-DD format
  time?: string;        // Optional time in HH:MM format (if omitted, creates all-day event)
}

/**
 * Result returned after successfully creating a calendar event
 */
interface CalendarEventResult {
  id: string;        // Google Calendar's unique event ID
  htmlLink: string;  // URL to view the event in Google Calendar
}

/**
 * Create a new event in the user's Google Calendar
 *
 * Supports two types of events:
 * 1. Timed events - Have a specific start time and 2-hour default duration
 * 2. All-day events - Span the entire day without specific times
 *
 * @param accessToken - OAuth2 access token from the user's Google sign-in
 * @param event - Event details to create
 * @returns Object containing the new event's ID and link
 */
export async function createCalendarEvent(
  accessToken: string,
  event: CalendarEventInput
): Promise<CalendarEventResult> {
  // Create OAuth2 client and set the user's access token
  // This authenticates API requests on behalf of the user
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  // Initialize the Google Calendar API client
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  // Variables to hold the event's start and end times
  let startDateTime: string;
  let endDateTime: string;

  // Determine if this is a timed event or all-day event
  if (event.time) {
    // TIMED EVENT: Has a specific start time
    // Combine date and time into ISO format: "2024-01-15T14:00:00"
    startDateTime = `${event.date}T${event.time}:00`;

    // Calculate end time (default 1-hour duration)
    const startDate = new Date(startDateTime);
    const endDate = new Date(startDate.getTime() + 1 * 60 * 60 * 1000); // Add 1 hour in milliseconds

    // Convert to ISO strings for the API
    endDateTime = endDate.toISOString();
    startDateTime = startDate.toISOString();
  } else {
    // ALL-DAY EVENT: No specific time, spans entire day
    // For all-day events, we just use the date without time
    startDateTime = event.date;
    endDateTime = event.date;
  }

  // Build the calendar event object based on event type
  // Timed events use dateTime, all-day events use date
  const calendarEvent = event.time
    ? {
        // TIMED EVENT STRUCTURE
        summary: event.name,        // Event title shown in calendar
        description: event.description,
        location: event.location,
        start: {
          dateTime: startDateTime,
          // Use the user's local timezone for proper display
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      }
    : {
        // ALL-DAY EVENT STRUCTURE
        summary: event.name,
        description: event.description,
        location: event.location,
        start: {
          date: startDateTime, // Just the date, no time
        },
        end: {
          date: endDateTime,
        },
      };

  // Make API call to create the event in the user's primary calendar
  const response = await calendar.events.insert({
    calendarId: "primary", // "primary" refers to the user's main calendar
    requestBody: calendarEvent,
  });

  // Validate that we got the expected data back
  if (!response.data.id || !response.data.htmlLink) {
    throw new Error("Failed to create calendar event");
  }

  // Return the event ID (for future updates/deletions) and link (for user to view)
  return {
    id: response.data.id,
    htmlLink: response.data.htmlLink,
  };
}

/**
 * Delete an event from the user's Google Calendar
 *
 * Used when an event is removed from our app and should also be
 * removed from the user's Google Calendar.
 *
 * @param accessToken - OAuth2 access token from the user's Google sign-in
 * @param eventId - The Google Calendar event ID to delete
 */
export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  // Set up OAuth2 client with user's access token
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  // Initialize Calendar API client
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  // Delete the event from the user's primary calendar
  await calendar.events.delete({
    calendarId: "primary",
    eventId: eventId,
  });
}
