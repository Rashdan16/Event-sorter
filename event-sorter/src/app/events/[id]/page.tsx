"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import EventForm from "@/components/EventForm";
import Link from "next/link";

interface Event {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  date: string;
  time?: string | null;
  ticketUrl?: string | null;
  imageUrl?: string | null;
  googleEventId?: string | null;
}

export default function EventPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (session && eventId) {
      fetchEvent();
    }
  }, [session, eventId]);

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (response.ok) {
        const data = await response.json();
        setEvent(data);
      } else if (response.status === 404) {
        router.push("/");
      }
    } catch (error) {
      console.error("Error fetching event:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!session) {
    router.push("/auth/signin");
    return null;
  }

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
          imageUrl: event.imageUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update event");
      }

      const updatedEvent = await response.json();
      setEvent(updatedEvent);
      setSuccessMessage("Event updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update event");
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete event");
      }

      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
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
        <button
          onClick={handleDelete}
          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
        >
          Delete event
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300">
          {successMessage}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Edit Event</h1>
        <EventForm
          initialData={{
            name: event.name,
            description: event.description ?? null,
            location: event.location ?? null,
            date: event.date.split("T")[0],
            time: event.time ?? null,
            ticketUrl: event.ticketUrl ?? null,
          }}
          imageUrl={event.imageUrl || undefined}
          onSubmit={handleSubmit}
          onAddToCalendar={handleAddToCalendar}
          isInCalendar={!!event.googleEventId}
          isSubmitting={isSubmitting}
        />
      </div>

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
