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
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Please sign in to view your bin</h1>
        <Link href="/auth/signin" className="text-blue-600 dark:text-blue-400 hover:underline mt-4 inline-block">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/event-sorter"
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
            Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bin</h1>
        </div>

        <div className="flex items-center gap-3">
          {events.length > 0 && !selectionMode && (
            <>
              <button
                onClick={() => setSelectionMode(true)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                Select
              </button>
              <button
                onClick={emptyBin}
                disabled={processing}
                className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition disabled:opacity-50"
              >
                Empty Bin
              </button>
            </>
          )}
        </div>
      </div>

      {selectionMode && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-blue-800 dark:text-blue-200 font-medium">
              {selectedIds.size} event(s) selected
            </span>
            <button
              onClick={selectAllEvents}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm underline"
            >
              {selectedIds.size === events.length ? "Deselect All" : "Select All"}
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
              onClick={restoreSelected}
              disabled={selectedIds.size === 0 || processing}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Bin is empty
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Deleted events will appear here
          </p>
          <Link
            href="/event-sorter"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Back to Events
          </Link>
        </div>
      ) : (
        <>
          {selectionMode && (
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
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
                  className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 overflow-hidden transition-all duration-200 opacity-70 ${
                    selectionMode ? "cursor-pointer" : ""
                  } ${
                    selectionMode
                      ? isSelected
                        ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-900"
                        : "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {selectionMode && (
                    <div className="absolute top-3 left-3 z-10">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-blue-500 border-blue-500"
                            : "bg-white/90 dark:bg-gray-800/90 border-gray-400 dark:border-gray-500"
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
                    <div className="h-48 bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
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

                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
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
                      {event.time && <span>at {event.time}</span>}
                    </div>

                    {event.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
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
                          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded font-medium">
                            Free
                          </span>
                        ) : (
                          <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded font-medium">
                            £{event.price.replace(/[£$]/g, "")}
                          </span>
                        )
                      )}
                      <span className="text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-1 rounded">
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
  );
}
