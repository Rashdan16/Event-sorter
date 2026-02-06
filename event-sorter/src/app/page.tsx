"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import EventCard from "@/components/EventCard";
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

export default function Home() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<"all" | "day" | "week" | "nextweek" | "month">("all");

  useEffect(() => {
    if (session) {
      fetchEvents();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events");
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter events based on search query and time filter
  const filteredEvents = useMemo(() => {
    let filtered = events;

    // Apply time filter
    if (timeFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      let startDate: Date = today;
      let endDate: Date;

      if (timeFilter === "day") {
        // End of today
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 1);
      } else if (timeFilter === "week") {
        // End of this week (Sunday)
        const dayOfWeek = today.getDay();
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + (7 - dayOfWeek));
      } else if (timeFilter === "nextweek") {
        // Next week (Monday to Sunday)
        const dayOfWeek = today.getDay();
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() + (7 - dayOfWeek) + 1); // Next Monday
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7); // Following Sunday
      } else {
        // End of this month
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      }

      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.date);
        return eventDate >= startDate && eventDate < endDate;
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((event) => {
        const name = event.name?.toLowerCase() || "";
        const location = event.location?.toLowerCase() || "";
        const description = event.description?.toLowerCase() || "";

        return (
          name.includes(query) ||
          location.includes(query) ||
          description.includes(query)
        );
      });
    }

    return filtered;
  }, [events, searchQuery, timeFilter]);

  const toggleSelectEvent = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllEvents = () => {
    if (selectedIds.size === filteredEvents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEvents.map((e) => e.id)));
    }
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const deleteSelectedEvents = async () => {
    if (selectedIds.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.size} event(s)? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      const deletePromises = Array.from(selectedIds).map((id) =>
        fetch(`/api/events/${id}`, { method: "DELETE" })
      );

      await Promise.all(deletePromises);

      // Remove deleted events from state
      setEvents((prev) => prev.filter((e) => !selectedIds.has(e.id)));
      setSelectedIds(new Set());
      setSelectionMode(false);
    } catch (error) {
      console.error("Error deleting events:", error);
      alert("Failed to delete some events. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  // Separate upcoming and past events from filtered results
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcomingEvents = filteredEvents.filter((e) => new Date(e.date) >= now);
  const pastEvents = filteredEvents.filter((e) => new Date(e.date) < now);

  if (status === "loading" || loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center py-20">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Event Sorter
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Upload event posters and let AI extract the details. Organize your
            upcoming events and sync them to your Google Calendar.
          </p>
          <Link
            href="/auth/signin"
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition"
          >
            Get Started
          </Link>

          <div className="mt-16 grid md:grid-cols-3 gap-8 text-left">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Upload Posters</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Simply upload a photo of any event poster or flyer.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">AI Extraction</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Our AI extracts the event name, date, time, location, and more.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-blue-600 dark:text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Sync to Calendar</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Add events directly to your Google Calendar with one click.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Your Events</h1>
        <div className="flex items-center gap-3">
          {events.length > 0 && !selectionMode && (
            <button
              onClick={() => setSelectionMode(true)}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete
            </button>
          )}
          <Link
            href="/upload"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            + Add Event
          </Link>
        </div>
      </div>

      {/* Time filter toggle */}
      {events.length > 0 && !selectionMode && (
        <div className="flex items-center mb-4">
          <div className="group flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            <button
              onClick={() => setTimeFilter("all")}
              className={`px-4 py-2 text-sm font-medium transition ${
                timeFilter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {timeFilter === "all" ? "All" : timeFilter === "day" ? "Today" : timeFilter === "week" ? "This Week" : timeFilter === "nextweek" ? "Next Week" : "This Month"}
            </button>
            <div className="flex overflow-hidden max-w-0 group-hover:max-w-[500px] transition-all duration-500 ease-out">
              <button
                onClick={() => setTimeFilter("day")}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-l border-gray-300 dark:border-gray-600 transition ${
                  timeFilter === "day"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setTimeFilter("week")}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-l border-gray-300 dark:border-gray-600 transition ${
                  timeFilter === "week"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setTimeFilter("nextweek")}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-l border-gray-300 dark:border-gray-600 transition ${
                  timeFilter === "nextweek"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                Next Week
              </button>
              <button
                onClick={() => setTimeFilter("month")}
                className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-l border-gray-300 dark:border-gray-600 transition ${
                  timeFilter === "month"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                This Month
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search bar */}
      {events.length > 0 && !selectionMode && (
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-400 dark:text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="search"
            placeholder="Search events by name, location, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
              }
            }}
            autoComplete="off"
            className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Search/filter results indicator */}
      {(searchQuery || timeFilter !== "all") && (
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Found {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
          {timeFilter !== "all" && (
            <span>
              {" "}for {timeFilter === "day" ? "today" : timeFilter === "week" ? "this week" : timeFilter === "nextweek" ? "next week" : "this month"}
            </span>
          )}
          {searchQuery && (
            <span> matching &quot;{searchQuery}&quot;</span>
          )}
        </div>
      )}

      {/* Selection mode toolbar */}
      {selectionMode && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-red-800 dark:text-red-200 font-medium">
              {selectedIds.size} event(s) selected
            </span>
            <button
              onClick={selectAllEvents}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm underline"
            >
              {selectedIds.size === filteredEvents.length ? "Deselect All" : "Select All"}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={cancelSelection}
              className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={deleteSelectedEvents}
              disabled={selectedIds.size === 0 || deleting}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete Selected
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {events.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <svg
            className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No events yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Upload your first event poster to get started
          </p>
          <Link
            href="/upload"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Upload Event Poster
          </Link>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <svg
            className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No events found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            No events
            {timeFilter !== "all" && (
              <span> {timeFilter === "day" ? "today" : timeFilter === "week" ? "this week" : timeFilter === "nextweek" ? "next week" : "this month"}</span>
            )}
            {searchQuery && (
              <span> matching &quot;{searchQuery}&quot;</span>
            )}
            {!searchQuery && timeFilter === "all" && " match your filters"}
          </p>
          <div className="flex items-center justify-center gap-3">
            {timeFilter !== "all" && (
              <button
                onClick={() => setTimeFilter("all")}
                className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-6 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                Show All Events
              </button>
            )}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-6 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                Clear Search
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {selectionMode && (
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
              Click on events to select them for deletion
            </p>
          )}

          {upcomingEvents.length > 0 && (
            <section className="mb-12">
              <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
                Upcoming Events ({upcomingEvents.length})
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    selectionMode={selectionMode}
                    isSelected={selectedIds.has(event.id)}
                    onToggleSelect={toggleSelectEvent}
                  />
                ))}
              </div>
            </section>
          )}

          {pastEvents.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-4">
                Past Events ({pastEvents.length})
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    selectionMode={selectionMode}
                    isSelected={selectedIds.has(event.id)}
                    onToggleSelect={toggleSelectEvent}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
