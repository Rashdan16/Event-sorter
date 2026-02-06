/**
 * EventCard Component
 *
 * A reusable card component that displays event information in a visually
 * appealing format. Used in the events list on the home page.
 *
 * Features:
 * - Displays event poster image (if available)
 * - Shows event name, date, time, and location
 * - Indicates if event is synced to Google Calendar
 * - Shows "Past Event" badge for events that have already occurred
 * - Supports selection mode for bulk deletion
 * - Links to event detail page when not in selection mode
 *
 * This is a client component ("use client") because it handles click events.
 */

"use client";

import Link from "next/link";

/**
 * Event data structure
 * Matches the shape returned by the events API
 */
interface Event {
  id: string;                      // Unique identifier
  name: string;                    // Event title
  description?: string | null;     // Event description (optional)
  location?: string | null;        // Venue/location (optional)
  date: string;                    // Event date (ISO string)
  time?: string | null;            // Event time (optional)
  ticketUrl?: string | null;       // Ticket URL (optional)
  imageUrl?: string | null;        // Poster image URL (optional)
  googleEventId?: string | null;   // Google Calendar ID if synced (optional)
}

/**
 * Props for the EventCard component
 */
interface EventCardProps {
  event: Event;                              // The event data to display
  selectionMode?: boolean;                   // Whether bulk selection is active
  isSelected?: boolean;                      // Whether this card is selected
  onToggleSelect?: (id: string) => void;     // Callback when selection is toggled
}

/**
 * EventCard Component
 *
 * @param event - The event data to display
 * @param selectionMode - When true, clicking the card toggles selection instead of navigating
 * @param isSelected - Whether this card is currently selected (visual indicator)
 * @param onToggleSelect - Function called when the card is clicked in selection mode
 */
export default function EventCard({
  event,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
}: EventCardProps) {
  // Parse the event date for display and comparison
  const eventDate = new Date(event.date);

  // Determine if the event is upcoming or in the past
  // Compare against midnight today (start of day)
  const isUpcoming = eventDate >= new Date(new Date().setHours(0, 0, 0, 0));

  /**
   * Format a date for display
   * Example output: "Sat, Jan 15, 2025"
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
   * Handle click events on the card
   * In selection mode: toggle the selection state
   * Otherwise: allow default Link navigation
   */
  const handleClick = (e: React.MouseEvent) => {
    if (selectionMode && onToggleSelect) {
      e.preventDefault(); // Prevent navigation
      onToggleSelect(event.id); // Toggle this card's selection
    }
  };

  // The main card content (shared between Link and non-Link versions)
  const cardContent = (
    <div
      onClick={handleClick}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 overflow-hidden transition-all duration-200 cursor-pointer ${
        // Dim past events slightly
        !isUpcoming ? "opacity-60" : ""
      } ${
        // Different border styles based on mode and selection state
        selectionMode
          ? isSelected
            // Selected in selection mode: red border with glow
            ? "border-red-500 ring-2 ring-red-200 dark:ring-red-900"
            // Unselected in selection mode: subtle red hover
            : "border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700"
          // Normal mode: blue hover effect with scale animation
          : "border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-400 hover:scale-105"
      }`}
    >
      {/* Selection checkbox - only shown in selection mode */}
      {selectionMode && (
        <div className="absolute top-3 left-3 z-10">
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              isSelected
                // Selected: filled red circle with checkmark
                ? "bg-red-500 border-red-500"
                // Unselected: empty circle
                : "bg-white/90 dark:bg-gray-800/90 border-gray-400 dark:border-gray-500"
            }`}
          >
            {/* Checkmark icon - only shown when selected */}
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

      {/* Event poster image (if available) */}
      {event.imageUrl && (
        <div className="h-48 bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center relative">
          <img
            src={event.imageUrl}
            alt={event.name}
            className="w-full h-full object-contain" // Maintain aspect ratio
          />
        </div>
      )}

      {/* Event details section */}
      <div className="p-4">
        {/* Event name/title */}
        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
          {event.name}
        </h3>

        {/* Date and time row with calendar icon */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
          {/* Calendar icon */}
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
          {/* Show time if available */}
          {event.time && <span>at {event.time}</span>}
        </div>

        {/* Location row with map pin icon (if available) */}
        {event.location && (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
            {/* Map pin icon */}
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
            {/* Truncate long location names */}
            <span className="truncate">{event.location}</span>
          </div>
        )}

        {/* Status badges */}
        <div className="flex items-center gap-2 mt-3">
          {/* "In Calendar" badge - shown when synced to Google Calendar */}
          {event.googleEventId && (
            <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">
              In Calendar
            </span>
          )}
          {/* "Past Event" badge - shown for events that have already occurred */}
          {!isUpcoming && (
            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
              Past Event
            </span>
          )}
        </div>
      </div>
    </div>
  );

  // In selection mode, render without Link wrapper (clicking toggles selection)
  if (selectionMode) {
    return <div className="relative">{cardContent}</div>;
  }

  // In normal mode, wrap with Link to navigate to event detail page
  return (
    <Link href={`/events/${event.id}`} className="relative block">
      {cardContent}
    </Link>
  );
}
