import { google } from "googleapis";

interface CalendarEventInput {
  name: string;
  description?: string;
  location?: string;
  date: string;
  time?: string;
}

interface CalendarEventResult {
  id: string;
  htmlLink: string;
}

export async function createCalendarEvent(
  accessToken: string,
  event: CalendarEventInput
): Promise<CalendarEventResult> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  // Parse date and time
  let startDateTime: string;
  let endDateTime: string;

  if (event.time) {
    // If time is provided, create a timed event
    startDateTime = `${event.date}T${event.time}:00`;
    // Default to 2 hours duration
    const startDate = new Date(startDateTime);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    endDateTime = endDate.toISOString();
    startDateTime = startDate.toISOString();
  } else {
    // All-day event
    startDateTime = event.date;
    endDateTime = event.date;
  }

  const calendarEvent = event.time
    ? {
        summary: event.name,
        description: event.description,
        location: event.location,
        start: {
          dateTime: startDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      }
    : {
        summary: event.name,
        description: event.description,
        location: event.location,
        start: {
          date: startDateTime,
        },
        end: {
          date: endDateTime,
        },
      };

  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: calendarEvent,
  });

  if (!response.data.id || !response.data.htmlLink) {
    throw new Error("Failed to create calendar event");
  }

  return {
    id: response.data.id,
    htmlLink: response.data.htmlLink,
  };
}

export async function deleteCalendarEvent(
  accessToken: string,
  eventId: string
): Promise<void> {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  await calendar.events.delete({
    calendarId: "primary",
    eventId: eventId,
  });
}
