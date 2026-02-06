"use client";

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

interface EventCardProps {
  event: Event;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export default function EventCard({
  event,
  selectionMode = false,
  isSelected = false,
  onToggleSelect,
}: EventCardProps) {
  const eventDate = new Date(event.date);
  const isUpcoming = eventDate >= new Date(new Date().setHours(0, 0, 0, 0));

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleClick = (e: React.MouseEvent) => {
    if (selectionMode && onToggleSelect) {
      e.preventDefault();
      onToggleSelect(event.id);
    }
  };

  const cardContent = (
    <div
      onClick={handleClick}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 overflow-hidden transition-all duration-200 cursor-pointer ${
        !isUpcoming ? "opacity-60" : ""
      } ${
        selectionMode
          ? isSelected
            ? "border-red-500 ring-2 ring-red-200 dark:ring-red-900"
            : "border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700"
          : "border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-400 hover:scale-105"
      }`}
    >
      {/* Selection checkbox overlay */}
      {selectionMode && (
        <div className="absolute top-3 left-3 z-10">
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              isSelected
                ? "bg-red-500 border-red-500"
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
        <div className="h-48 bg-gray-100 dark:bg-gray-700 overflow-hidden flex items-center justify-center relative">
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
          <span>{formatDate(eventDate)}</span>
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

        <div className="flex items-center gap-2 mt-3">
          {event.googleEventId && (
            <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded">
              In Calendar
            </span>
          )}
          {!isUpcoming && (
            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
              Past Event
            </span>
          )}
        </div>
      </div>
    </div>
  );

  // In selection mode, don't wrap with Link
  if (selectionMode) {
    return <div className="relative">{cardContent}</div>;
  }

  return (
    <Link href={`/events/${event.id}`} className="relative block">
      {cardContent}
    </Link>
  );
}
