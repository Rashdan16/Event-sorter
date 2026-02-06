/**
 * Event Detail Page Component
 *
 * Dynamic route page for viewing and editing a single event.
 * URL pattern: /events/[id] where [id] is the event's database ID
 *
 * Features:
 * - View event details
 * - Edit event information (name, date, time, location, etc.)
 * - Add event to Google Calendar
 * - Delete event (soft delete - moves to bin)
 * - View ticket link (if available)
 *
 * This is a client component because it:
 * - Uses dynamic params from URL
 * - Manages form state and user interactions
 * - Handles API calls for CRUD operations
 */

"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import EventForm from "@/components/EventForm";
import Link from "next/link";

/**
 * Event interface matching the database schema
 */
interface Event {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  date: string;
  time?: string | null;
  ticketUrl?: string | null;
  imageUrl?: string | null;
  googleEventId?: string | null; // Set when event is synced to Google Calendar
}

/**
 * Event Detail Page Component
 *
 * Displays a single event with edit capabilities
 */
export default function EventPage() {
  // ============================================
  // HOOKS
  // ============================================

  // Authentication session
  const { data: session, status } = useSession();

  // Router for navigation
  const router = useRouter();

  // Get event ID from URL params
  const params = useParams();
  const eventId = params.id as string;

  // ============================================
  // STATE
  // ============================================

  // The event data fetched from API
  const [event, setEvent] = useState<Event | null>(null);

  // Loading state during initial fetch
  const [loading, setLoading] = useState(true);

  // Loading state during form submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Error message to display
  const [error, setError] = useState<string | null>(null);

  // Success message to display (e.g., after save or calendar add)
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ============================================
  // DATA FETCHING
  // ============================================

  /**
   * Fetch event data when session and eventId are available
   */
  useEffect(() => {
    if (session && eventId) {
      fetchEvent();
    }
  }, [session, eventId]);

  /**
   * Fetch single event from API
   * Redirects to home if event not found (404)
   */
  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setEvent(data);
      } else if (response.status === 404) {
        // Event not found - redirect to home
        router.push("/");
      }
    } catch (error) {
      console.error("Error fetching event:", error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // LOADING STATE
  // ============================================

  // Show loading spinner while checking auth or fetching event
  if (status === "loading" || loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // ============================================
  // AUTHENTICATION CHECK
  // ============================================

  // Redirect to sign-in if not authenticated
  if (!session) {
    router.push("/auth/signin");
    return null;
  }

  // ============================================
  // NOT FOUND STATE
  // ============================================

  // Show message if event doesn't exist
  if (!event) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Event not found</h1>
        <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline mt-4 inline-block">
          Back to events
        </Link>
      </div>
    );
  }

  // ============================================
  // EVENT HANDLERS
  // ============================================

  /**
   * Handle form submission to update event
   *
   * Sends PUT request to /api/events/[id] with updated data
   * Updates local state on success
   *
   * @param formData - The updated event data from the form
   */
  const handleSubmit = async (formData: {
    name: string;
    description: string;
    location: string;
    date: string;
    time: string;
    ticketUrl: string;
  }) => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          imageUrl: event.imageUrl, // Preserve existing image
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update event");
      }

      // Update local state with response data
      const updatedEvent = await response.json();
      setEvent(updatedEvent);
      setSuccessMessage("Event updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update event");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle "Add to Calendar" button click
   *
   * Creates a Google Calendar event via POST /api/calendar
   * Updates local state with the Google Event ID on success
   */
  const handleAddToCalendar = async () => {
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add to calendar");
      }

      // Update local state with Google Event ID
      const data = await response.json();
      setEvent((prev) =>
        prev ? { ...prev, googleEventId: data.googleEventId } : null
      );
      setSuccessMessage("Event added to your Google Calendar!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add to calendar"
      );
    }
  };

  /**
   * Handle event deletion
   *
   * Confirms with user, then sends DELETE to /api/events/[id]
   * This is a soft delete - event moves to bin
   * Redirects to home on success
   */
  const handleDelete = async () => {
    // Confirm before deleting
    if (!confirm("Move this event to bin?")) return;

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete event");
      }

      // Redirect to home page after successful deletion
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header Row: Back link and Delete button */}
      <div className="flex items-center justify-between mb-6">
        {/* Back to events link */}
        <Link
          href="/"
          className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to events
        </Link>

        {/* Delete button */}
        <button
          onClick={handleDelete}
          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
        >
          Delete event
        </button>
      </div>

      {/* Error Message Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Success Message Display */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300">
          {successMessage}
        </div>
      )}

      {/* Event Edit Form Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Edit Event</h1>
        <EventForm
          initialData={{
            name: event.name,
            description: event.description ?? null,
            location: event.location ?? null,
            date: event.date.split("T")[0], // Extract date part from ISO string
            time: event.time ?? null,
            ticketUrl: event.ticketUrl ?? null,
          }}
          imageUrl={event.imageUrl || undefined}
          onSubmit={handleSubmit}
          onAddToCalendar={handleAddToCalendar}
          isInCalendar={!!event.googleEventId} // True if already synced
          isSubmitting={isSubmitting}
        />
      </div>

      {/* Ticket URL Display (if available) */}
      {event.ticketUrl && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Ticket Link:</p>
          <a
            href={event.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline break-all"
          >
            {event.ticketUrl}
          </a>
        </div>
      )}
    </div>
  );
}
