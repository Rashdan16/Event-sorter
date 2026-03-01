"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

interface DeletedEvent {
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
  deletedAt: string;
}

export default function BinPage() {
  const { data: session, status } = useSession();
  const [events, setEvents] = useState<DeletedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (session) {
      fetchDeletedEvents();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchDeletedEvents = async () => {
    try {
      const response = await fetch("/api/bin");
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error("Error fetching bin:", error);
    } finally {
      setLoading(false);
    }
  };

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
    if (selectedIds.size === events.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(events.map((e) => e.id)));
    }
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const restoreSelected = async () => {
    if (selectedIds.size === 0) return;
    setProcessing(true);

    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/bin/${id}`, { method: "POST" })
        )
      );

      setEvents((prev) => prev.filter((e) => !selectedIds.has(e.id)));
      setSelectedIds(new Set());
      setSelectionMode(false);
    } catch (error) {
      console.error("Error restoring events:", error);
      alert("Failed to restore some events. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const deleteSelectedPermanently = async () => {
    if (selectedIds.size === 0) return;

    if (!confirm(`Permanently delete ${selectedIds.size} event(s)? This cannot be undone.`)) return;

    setProcessing(true);

    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/bin/${id}`, { method: "DELETE" })
        )
      );

      setEvents((prev) => prev.filter((e) => !selectedIds.has(e.id)));
      setSelectedIds(new Set());
      setSelectionMode(false);
    } catch (error) {
      console.error("Error deleting events:", error);
      alert("Failed to delete some events. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const emptyBin = async () => {
    if (!confirm("Empty bin? All events will be permanently deleted. This cannot be undone.")) return;

    setProcessing(true);
    try {
      await fetch("/api/bin", { method: "DELETE" });
      setEvents([]);
      setSelectedIds(new Set());
      setSelectionMode(false);
    } catch (error) {
      console.error("Error emptying bin:", error);
      alert("Failed to empty bin. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
  };

  const formatDeletedAt = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] dark:bg-[#0a0a0a] transition-colors duration-200 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] dark:bg-[#0a0a0a] transition-colors duration-200 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Please sign in to view your bin</h1>
          <Link href="/auth/signin" className="text-orange-400 hover:text-orange-300 mt-4 inline-block transition-colors duration-200">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-[#0a0a0a] transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/event-sorter"
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1 transition-colors duration-200"
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Bin</h1>
          </div>

          <div className="flex items-center gap-3">
            {events.length > 0 && !selectionMode && (
              <>
                <button
                  onClick={() => {
                    setSelectionMode(true);
                    setSelectedIds(new Set(events.map((e) => e.id)));
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] rounded-lg hover:bg-gray-200 dark:hover:bg-white/[0.08] hover:border-gray-300 dark:hover:border-white/[0.1] transition-all duration-200"
                >
                  Select All
                </button>
                <button
                  onClick={() => setSelectionMode(true)}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] rounded-lg hover:bg-gray-200 dark:hover:bg-white/[0.08] hover:border-gray-300 dark:hover:border-white/[0.1] transition-all duration-200"
                >
                  Select
                </button>
                <button
                  onClick={emptyBin}
                  disabled={processing}
                  className="flex items-center gap-2 px-4 py-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all duration-200 disabled:opacity-50"
                >
                  Empty Bin
                </button>
              </>
            )}
          </div>
        </div>

        {/* Selection mode bar */}
        {selectionMode && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-orange-400 font-medium">
                {selectedIds.size} event(s) selected
              </span>
              <button
                onClick={selectAllEvents}
                className="text-orange-400 hover:text-orange-300 text-sm underline transition-colors duration-200"
              >
                {selectedIds.size === events.length ? "Deselect All" : "Select All"}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={cancelSelection}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.06] rounded-lg hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={restoreSelected}
                disabled={selectedIds.size === 0 || processing}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 disabled:opacity-50"
              >
                {processing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
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
                      d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                    />
                  </svg>
                )}
                Restore
              </button>
              <button
                onClick={deleteSelectedPermanently}
                disabled={selectedIds.size === 0 || processing}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 disabled:opacity-50"
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
                Delete Forever
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Bin is empty
            </h3>
            <p className="text-gray-500 mb-6">
              Deleted events will appear here
            </p>
            <Link
              href="/event-sorter"
              className="inline-block bg-gradient-to-r from-orange-500 to-amber-500 text-white px-6 py-2 rounded-lg hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-200 font-medium"
            >
              Back to Events
            </Link>
          </div>
        ) : (
          <>
            {selectionMode && (
              <p className="text-gray-500 mb-4 text-sm">
                Click on events to select them
              </p>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => {
                const eventDate = new Date(event.date);
                const isSelected = selectedIds.has(event.id);

                return (
                  <div
                    key={event.id}
                    onClick={() => selectionMode && toggleSelectEvent(event.id)}
                    className={`relative glass-card rounded-xl overflow-hidden transition-all duration-200 opacity-70 ${
                      selectionMode ? "" : ""
                    } ${
                      selectionMode
                        ? isSelected
                          ? "!border-orange-500 ring-2 ring-orange-500/20"
                          : "hover:!border-orange-500/40"
                        : ""
                    }`}
                  >
                    {selectionMode && (
                      <div className="absolute top-3 left-3 z-10">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-orange-500 border-orange-500"
                              : "bg-black/60 border-gray-500"
                          }`}
                        >
                          {isSelected && (
                            <svg
                              className="w-4 h-4 text-white"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    )}

                    {event.imageUrl && (
                      <div className="h-48 bg-gray-50 dark:bg-white/[0.02] overflow-hidden flex items-center justify-center">
                        <img
                          src={event.imageUrl}
                          alt={event.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}

                    <div className="p-4">
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                        {event.name}
                      </h3>

                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                        <svg
                          className="w-4 h-4"
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
                        <span>
                          {formatDate(eventDate)}
                          {event.endDate && ` - ${formatDate(new Date(event.endDate))}`}
                        </span>
                        {event.time && <span>at {formatTime(event.time)}</span>}
                      </div>

                      {event.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {event.price && (
                          event.price.toLowerCase() === "free" ? (
                            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded font-medium">
                              Free
                            </span>
                          ) : (
                            <span className="text-xs bg-orange-500/10 text-orange-400 px-2 py-1 rounded font-medium">
                              £{event.price.replace(/[£$]/g, "")}
                            </span>
                          )
                        )}
                        <span className="text-xs bg-red-500/10 text-red-400 px-2 py-1 rounded">
                          Deleted {formatDeletedAt(event.deletedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
