/**
 * Bin Page Component
 *
 * Displays soft-deleted events that can be restored or permanently deleted.
 * This is the "trash" or "recycle bin" feature for the Event Sorter app.
 *
 * Features:
 * - View all deleted events with their deletion timestamps
 * - Selection mode for bulk operations
 * - Restore selected events (moves back to main event list)
 * - Delete selected events permanently (irreversible)
 * - Empty entire bin at once
 *
 * This is a client component because it:
 * - Uses hooks (useSession, useState, useEffect)
 * - Handles user interactions (selection, restore, delete)
 * - Manages complex state for selection mode
 */

"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Interface for deleted events
 * Includes deletedAt timestamp to show when it was deleted
 */
interface DeletedEvent {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  date: string;
  time?: string | null;
  ticketUrl?: string | null;
  imageUrl?: string | null;
  deletedAt: string; // ISO timestamp of when event was deleted
}

/**
 * Bin Page Component
 *
 * Renders the deleted events list with restore/delete functionality
 */
export default function BinPage() {
  // ============================================
  // HOOKS & STATE
  // ============================================

  // Authentication session
  const { data: session, status } = useSession();

  // List of deleted events fetched from API
  const [events, setEvents] = useState<DeletedEvent[]>([]);

  // Loading state during initial fetch
  const [loading, setLoading] = useState(true);

  // Whether selection mode is active
  const [selectionMode, setSelectionMode] = useState(false);

  // Set of selected event IDs
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Loading state during restore/delete operations
  const [processing, setProcessing] = useState(false);

  // ============================================
  // DATA FETCHING
  // ============================================

  /**
   * Fetch deleted events when user is authenticated
   */
  useEffect(() => {
    if (session) {
      fetchDeletedEvents();
    } else {
      setLoading(false);
    }
  }, [session]);

  /**
   * Fetch all deleted events from the bin API
   * These are events where deletedAt is not null
   */
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

  // ============================================
  // SELECTION MODE HANDLERS
  // ============================================

  /**
   * Toggle selection state for a single event
   */
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

  /**
   * Select or deselect all events
   */
  const selectAllEvents = () => {
    if (selectedIds.size === events.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(events.map((e) => e.id)));
    }
  };

  /**
   * Exit selection mode and clear selections
   */
  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  // ============================================
  // ACTION HANDLERS
  // ============================================

  /**
   * Restore selected events
   *
   * Sends POST request to /api/bin/[id] for each selected event
   * This sets deletedAt to null, making the event visible again
   */
  const restoreSelected = async () => {
    if (selectedIds.size === 0) return;
    setProcessing(true);

    try {
      // Restore all selected events in parallel
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/bin/${id}`, { method: "POST" })
        )
      );

      // Remove restored events from local state
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

  /**
   * Permanently delete selected events
   *
   * Sends DELETE request to /api/bin/[id] for each selected event
   * This is irreversible - events are completely removed from database
   */
  const deleteSelectedPermanently = async () => {
    if (selectedIds.size === 0) return;

    // Confirm before permanent deletion
    if (!confirm(`Permanently delete ${selectedIds.size} event(s)? This cannot be undone.`)) return;

    setProcessing(true);

    try {
      // Delete all selected events in parallel
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/bin/${id}`, { method: "DELETE" })
        )
      );

      // Remove deleted events from local state
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

  /**
   * Empty the entire bin
   *
   * Sends DELETE request to /api/bin to permanently delete all events
   * This is irreversible
   */
  const emptyBin = async () => {
    // Confirm before emptying bin
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

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Format a date for display
   * Example: "Sat, Jan 15, 2025"
   */
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  /**
   * Format the deletedAt timestamp for display
   * Example: "Jan 15, 3:30 PM"
   */
  const formatDeletedAt = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // ============================================
  // LOADING STATE
  // ============================================

  // Show loading spinner while checking auth or fetching events
  if (status === "loading" || loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // ============================================
  // UNAUTHENTICATED STATE
  // ============================================

  // Show sign-in prompt if not authenticated
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

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Row */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          {/* Back to home link */}
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
            Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bin</h1>
        </div>

        {/* Action Buttons (when not in selection mode) */}
        <div className="flex items-center gap-3">
          {events.length > 0 && !selectionMode && (
            <>
              {/* Enter selection mode */}
              <button
                onClick={() => setSelectionMode(true)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                Select
              </button>
              {/* Empty bin button */}
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

      {/* Selection Mode Toolbar */}
      {selectionMode && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Selection count */}
            <span className="text-blue-800 dark:text-blue-200 font-medium">
              {selectedIds.size} event(s) selected
            </span>
            {/* Select/Deselect all toggle */}
            <button
              onClick={selectAllEvents}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm underline"
            >
              {selectedIds.size === events.length ? "Deselect All" : "Select All"}
            </button>
          </div>
          <div className="flex items-center gap-3">
            {/* Cancel button */}
            <button
              onClick={cancelSelection}
              className="px-4 py-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            {/* Restore button */}
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
            {/* Delete permanently button */}
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

      {/* ============================================ */}
      {/* CONTENT AREA */}
      {/* ============================================ */}

      {events.length === 0 ? (
        // EMPTY STATE - No deleted events
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          {/* Trash icon */}
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
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Back to Events
          </Link>
        </div>
      ) : (
        // EVENTS GRID - Display deleted events
        <>
          {/* Selection mode instruction */}
          {selectionMode && (
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
              Click on events to select them
            </p>
          )}

          {/* Event cards in responsive grid */}
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
                  {/* Selection Checkbox Overlay */}
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

                  {/* Event Image */}
                  {event.imageUrl && (
                    <div className="h-48 bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
                      <img
                        src={event.imageUrl}
                        alt={event.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  {/* Event Details */}
                  <div className="p-4">
                    {/* Event Name */}
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                      {event.name}
                    </h3>

                    {/* Event Date & Time */}
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
                      <span>{formatDate(eventDate)}</span>
                      {event.time && <span>at {event.time}</span>}
                    </div>

                    {/* Event Location */}
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

                    {/* Deletion Timestamp Badge */}
                    <div className="flex items-center gap-2 mt-3">
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
