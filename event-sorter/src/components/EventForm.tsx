/**
 * EventForm Component
 *
 * A reusable form component for creating and editing events.
 * Used on both the upload page (create new event) and event detail page (edit existing event).
 *
 * Features:
 * - Displays event poster image (if available)
 * - Input fields for all event details (name, date, time, location, etc.)
 * - Form validation (required fields marked with *)
 * - Submit button with loading state
 * - Optional "Add to Calendar" button for Google Calendar integration
 *
 * This is a client component because it manages form state and handles user input.
 */

"use client";

import { useState } from "react";
import { ExtractedEventData } from "@/types";

/**
 * Props for the EventForm component
 */
interface EventFormProps {
  initialData?: ExtractedEventData;           // Pre-fill form with extracted/existing data
  imageUrl?: string;                          // URL of event poster image to display
  onSubmit: (data: EventFormData) => Promise<void>;  // Called when form is submitted
  onAddToCalendar?: () => Promise<void>;      // Optional: Called when "Add to Calendar" clicked
  isInCalendar?: boolean;                     // Whether event is already in Google Calendar
  isSubmitting?: boolean;                     // Show loading state on submit button
}

/**
 * Shape of form data submitted by this component
 */
interface EventFormData {
  name: string;        // Event name (required)
  description: string; // Event description
  location: string;    // Event venue/location
  date: string;       // Event start date in YYYY-MM-DD format (required)
  endDate: string;    // Event end date in YYYY-MM-DD format (optional, for multi-day events)
  time: string;       // Event time in HH:MM format
  ticketUrl: string;  // URL for ticket purchase
  price: string;      // Event price (e.g., "Free", "$10")
}

/**
 * EventForm Component
 *
 * @param initialData - Pre-populated data (from AI extraction or existing event)
 * @param imageUrl - Event poster image URL
 * @param onSubmit - Async function called with form data on submit
 * @param onAddToCalendar - Optional async function to add event to Google Calendar
 * @param isInCalendar - Whether the event is already synced to calendar
 * @param isSubmitting - External loading state for submit button
 */
export default function EventForm({
  initialData,
  imageUrl,
  onSubmit,
  onAddToCalendar,
  isInCalendar,
  isSubmitting,
}: EventFormProps) {
  // Form state - initialized with provided data or empty strings
  const [formData, setFormData] = useState<EventFormData>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    location: initialData?.location || "",
    date: initialData?.date || "",
    endDate: initialData?.endDate || "",
    time: initialData?.time || "",
    ticketUrl: initialData?.ticketUrl || "",
    price: initialData?.price || "",
  });

  // Loading state for the "Add to Calendar" button
  const [addingToCalendar, setAddingToCalendar] = useState(false);

  /**
   * Handle changes to any form input
   * Uses the input's name attribute to update the correct field
   */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    // Update only the changed field, keep others unchanged
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Handle form submission
   * Prevents default form behavior and calls the provided onSubmit function
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page reload
    await onSubmit(formData);
  };

  /**
   * Handle "Add to Calendar" button click
   * Manages loading state and calls the provided callback
   */
  const handleAddToCalendar = async () => {
    if (!onAddToCalendar) return;
    setAddingToCalendar(true);
    try {
      await onAddToCalendar();
    } finally {
      setAddingToCalendar(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Event poster image preview (if available) */}
      {imageUrl && (
        <div className="mb-6">
          <img
            src={imageUrl}
            alt="Event poster"
            className="max-h-48 rounded-lg mx-auto"
          />
        </div>
      )}

      {/* Event Name field (required) */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Event Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* Date, End Date, and Time fields in a 3-column grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Start Date field (required) */}
        <div>
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Start Date *
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* End Date field (optional, for multi-day events) */}
        <div>
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            End Date
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            min={formData.date}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Time field (optional) */}
        <div>
          <label
            htmlFor="time"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Time
          </label>
          <input
            type="time"
            id="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Location field (optional) */}
      <div>
        <label
          htmlFor="location"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Location
        </label>
        <input
          type="text"
          id="location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* Ticket URL field (optional) */}
      <div>
        <label
          htmlFor="ticketUrl"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Ticket URL
        </label>
        <input
          type="url"
          id="ticketUrl"
          name="ticketUrl"
          value={formData.ticketUrl}
          onChange={handleChange}
          placeholder="https://..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>

      {/* Price field (optional) - uses £ (GBP) currency */}
      <div>
        <label
          htmlFor="price"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Price
        </label>
        <div className="relative">
          {/* Show £ prefix when the value is not "Free" */}
          {formData.price.toLowerCase() !== "free" && formData.price !== "" && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 dark:text-gray-400 font-medium">£</span>
            </div>
          )}
          <input
            type="text"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder='e.g. "Free" or "10"'
            className={`w-full py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${
              formData.price.toLowerCase() !== "free" && formData.price !== ""
                ? "pl-8 pr-3"
                : "px-3"
            }`}
          />
        </div>
      </div>

      {/* Description field (optional, multiline) */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* Action buttons row */}
      <div className="flex gap-3">
        {/* Save/Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : "Save Event"}
        </button>

        {/* Add to Calendar button (only shown if callback provided) */}
        {onAddToCalendar && (
          <button
            type="button"
            onClick={handleAddToCalendar}
            disabled={addingToCalendar || isInCalendar}
            className={`py-2 px-4 rounded-lg transition flex items-center gap-2 ${
              isInCalendar
                ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 cursor-default"
                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {/* Button content changes based on state */}
            {isInCalendar ? (
              // Already in calendar - show checkmark
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                In Calendar
              </>
            ) : addingToCalendar ? (
              // Currently adding - show spinner
              <>
                <div className="w-4 h-4 border-2 border-gray-600 dark:border-gray-300 border-t-transparent rounded-full animate-spin" />
                Adding...
              </>
            ) : (
              // Default state - show calendar icon
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Add to Calendar
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
}
