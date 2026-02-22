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
  endDate?: string | null;
  time?: string | null;
  ticketUrl?: string | null;
  price?: string | null;
  imageUrl?: string | null;
  googleEventId?: string | null;
}

export default function EventSorterHome() {
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

  const filteredEvents = useMemo(() => {
    let filtered = events;

    if (timeFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      let startDate: Date = today;
      let endDate: Date;

      if (timeFilter === "day") {
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 1);
      } else if (timeFilter === "week") {
        const dayOfWeek = today.getDay();
        endDate = new Date(today);
        endDate.setDate(endDate.getDate() + (7 - dayOfWeek));
      } else if (timeFilter === "nextweek") {
        const dayOfWeek = today.getDay();
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() + (7 - dayOfWeek) + 1);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
      } else {
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      }

      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.date);
        return eventDate >= startDate && eventDate < endDate;
      });
    }

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
      `Move ${selectedIds.size} event(s) to bin?`
    );

    if (!confirmed) return;

    setDeleting(true);

    try {
      const deletePromises = Array.from(selectedIds).map((id) =>
        fetch(`/api/events/${id}`, { method: "DELETE" })
      );

      await Promise.all(deletePromises);

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

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcomingEvents = filteredEvents.filter((e) => new Date(e.date) >= now);
  const pastEvents = filteredEvents.filter((e) => new Date(e.date) < now);

  const timeFilterLabel = timeFilter === "all" ? "All" : timeFilter === "day" ? "Today" : timeFilter === "week" ? "This Week" : timeFilter === "nextweek" ? "Next Week" : "This Month";

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4 relative overflow-hidden">
        <div className="aurora-bg">
          <div className="aurora-orb" />
        </div>
        <div className="absolute inset-0 dot-grid pointer-events-none" />
        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Event Sorter
          </h1>
          <p className="text-lg text-gray-400 mb-10 leading-relaxed">
            Upload event posters and let AI extract the details. Organize your
            upcoming events and sync them to your Google Calendar.
          </p>
          <Link
            href="/auth/signin"
            className="glow-btn inline-block bg-gradient-to-r from-orange-500 to-amber-500 text-white px-10 py-4 rounded-full text-lg font-semibold"
          >
            Get Started
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors duration-200"
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
              Back
            </Link>
            <h1 className="text-2xl font-bold text-white tracking-tight">Your Events</h1>
          </div>
          <div className="flex items-center gap-3">
            {events.length > 0 && !selectionMode && (
              <button
                onClick={() => setSelectionMode(true)}
                className="flex items-center gap-2 px-4 py-2 text-gray-400 bg-white/[0.04] border border-white/[0.06] rounded-lg hover:bg-white/[0.08] hover:border-white/[0.1] transition-all duration-200"
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
              href="/event-sorter/chat"
              className="flex items-center gap-2 px-4 py-2 text-gray-400 bg-white/[0.04] border border-white/[0.06] rounded-lg hover:bg-white/[0.08] hover:border-white/[0.1] transition-all duration-200"
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              AI Chat
            </Link>
            <Link
              href="/event-sorter/upload"
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-200 text-sm font-medium"
            >
              + Add Event
            </Link>
          </div>
        </div>

        {/* Time filter */}
        {events.length > 0 && !selectionMode && (
          <div className="flex items-center mb-4">
            <div className="group flex rounded-lg border border-white/[0.06] overflow-hidden">
              <button
                onClick={() => setTimeFilter("all")}
                className={`px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  timeFilter === "all"
                    ? "bg-orange-500 text-white"
                    : "bg-white/[0.03] text-gray-400 hover:bg-white/[0.06]"
                }`}
              >
                {timeFilterLabel}
              </button>
              <div className="flex overflow-hidden max-w-0 group-hover:max-w-[500px] transition-all duration-500 ease-out">
                <button
                  onClick={() => setTimeFilter("day")}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-l border-white/[0.06] transition-all duration-200 ${
                    timeFilter === "day"
                      ? "bg-orange-500 text-white"
                      : "bg-white/[0.03] text-gray-400 hover:bg-white/[0.06]"
                  }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setTimeFilter("week")}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-l border-white/[0.06] transition-all duration-200 ${
                    timeFilter === "week"
                      ? "bg-orange-500 text-white"
                      : "bg-white/[0.03] text-gray-400 hover:bg-white/[0.06]"
                  }`}
                >
                  This Week
                </button>
                <button
                  onClick={() => setTimeFilter("nextweek")}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-l border-white/[0.06] transition-all duration-200 ${
                    timeFilter === "nextweek"
                      ? "bg-orange-500 text-white"
                      : "bg-white/[0.03] text-gray-400 hover:bg-white/[0.06]"
                  }`}
                >
                  Next Week
                </button>
                <button
                  onClick={() => setTimeFilter("month")}
                  className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-l border-white/[0.06] transition-all duration-200 ${
                    timeFilter === "month"
                      ? "bg-orange-500 text-white"
                      : "bg-white/[0.03] text-gray-400 hover:bg-white/[0.06]"
                  }`}
                >
                  This Month
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        {events.length > 0 && !selectionMode && (
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-500"
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
              className="w-full pl-10 pr-10 py-3 border border-white/[0.06] rounded-lg bg-white/[0.03] text-white placeholder-gray-500 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-200 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors duration-200"
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

        {/* Results count */}
        {(searchQuery || timeFilter !== "all") && (
          <div className="mb-4 text-sm text-gray-500">
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

        {/* Selection mode bar */}
        {selectionMode && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-red-400 font-medium">
                {selectedIds.size} event(s) selected
              </span>
              <button
                onClick={selectAllEvents}
                className="text-red-400 hover:text-red-300 text-sm underline transition-colors duration-200"
              >
                {selectedIds.size === filteredEvents.length ? "Deselect All" : "Select All"}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={cancelSelection}
                className="px-4 py-2 text-gray-400 bg-white/[0.04] border border-white/[0.06] rounded-lg hover:bg-white/[0.08] transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={deleteSelectedEvents}
                disabled={selectedIds.size === 0 || deleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 disabled:opacity-50"
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

        {/* Content */}
        {events.length === 0 ? (
          <div className="text-center py-20 glass-card rounded-2xl">
            <svg
              className="w-16 h-16 mx-auto text-gray-600 mb-4"
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
            <h3 className="text-lg font-medium text-white mb-2">
              No events yet
            </h3>
            <p className="text-gray-500 mb-6">
              Upload your first event poster to get started
            </p>
            <Link
              href="/event-sorter/upload"
              className="inline-block bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-2 rounded-lg hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-200 font-medium"
            >
              Upload Event Poster
            </Link>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-20 glass-card rounded-2xl">
            <svg
              className="w-16 h-16 mx-auto text-gray-600 mb-4"
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
            <h3 className="text-lg font-medium text-white mb-2">
              No events found
            </h3>
            <p className="text-gray-500 mb-6">
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
                  className="inline-block bg-white/[0.04] border border-white/[0.06] text-gray-400 px-6 py-2 rounded-lg hover:bg-white/[0.08] transition-all duration-200"
                >
                  Show All Events
                </button>
              )}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="inline-block bg-white/[0.04] border border-white/[0.06] text-gray-400 px-6 py-2 rounded-lg hover:bg-white/[0.08] transition-all duration-200"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {selectionMode && (
              <p className="text-gray-500 mb-4 text-sm">
                Click on events to select them for deletion
              </p>
            )}

            {upcomingEvents.length > 0 && (
              <section className="mb-12">
                <h2 className="text-lg font-semibold text-gray-400 mb-4">
                  Upcoming Events ({upcomingEvents.length})
                </h2>
                <div className="flex gap-6 overflow-x-auto pt-4 pb-4 pl-2 scrollbar-thin scroll-fade">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex-shrink-0 w-72 relative hover:z-10">
                      <EventCard
                        event={event}
                        selectionMode={selectionMode}
                        isSelected={selectedIds.has(event.id)}
                        onToggleSelect={toggleSelectEvent}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {pastEvents.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-500 mb-4">
                  Past Events ({pastEvents.length})
                </h2>
                <div className="flex gap-6 overflow-x-auto pt-4 pb-4 pl-2 scrollbar-thin scroll-fade">
                  {pastEvents.map((event) => (
                    <div key={event.id} className="flex-shrink-0 w-72 relative hover:z-10">
                      <EventCard
                        event={event}
                        selectionMode={selectionMode}
                        isSelected={selectedIds.has(event.id)}
                        onToggleSelect={toggleSelectEvent}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
