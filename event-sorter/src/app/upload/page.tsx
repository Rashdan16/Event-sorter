/**
 * Upload Page Component
 *
 * Handles the event creation flow:
 * 1. User uploads an event poster image
 * 2. Image is uploaded to the server (stored in /public/uploads)
 * 3. AI extracts event details from the image (via OpenAI GPT-4 Vision)
 * 4. User reviews and edits the extracted data
 * 5. Event is saved to the database
 *
 * State Machine:
 * - Initial: Shows ImageUploader component
 * - Extracting: Shows ImageUploader with loading overlay
 * - Review: Shows EventForm with extracted data pre-filled
 *
 * This is a client component because it:
 * - Manages complex form state
 * - Handles file uploads
 * - Needs to redirect after form submission
 */

"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import EventForm from "@/components/EventForm";
import { ExtractedEventData } from "@/types";

/**
 * Upload Page Component
 *
 * Multi-step form for creating new events from poster images
 */
export default function UploadPage() {
  // ============================================
  // HOOKS
  // ============================================

  // Authentication session and status
  const { data: session, status } = useSession();

  // Router for programmatic navigation
  const router = useRouter();

  // ============================================
  // STATE
  // ============================================

  // URL of the uploaded image (returned from /api/upload)
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // AI-extracted event data (returned from /api/extract)
  const [extractedData, setExtractedData] = useState<ExtractedEventData | null>(
    null
  );

  // Loading state during AI extraction
  const [isExtracting, setIsExtracting] = useState(false);

  // Loading state during form submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Error message to display to user
  const [error, setError] = useState<string | null>(null);

  // ============================================
  // LOADING STATE
  // ============================================

  // Show loading spinner while checking authentication
  if (status === "loading") {
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
  // EVENT HANDLERS
  // ============================================

  /**
   * Handle image upload completion
   *
   * Called by ImageUploader after successful upload to /api/upload
   * Triggers AI extraction to get event details from the image
   *
   * @param url - The server URL of the uploaded image
   */
  const handleImageUpload = async (url: string) => {
    setImageUrl(url);
    setError(null);
    setIsExtracting(true);

    try {
      // Call AI extraction endpoint
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      });

      // Handle extraction errors
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to extract event data");
      }

      // Store extracted data - this triggers switch to EventForm view
      const data = await response.json();
      setExtractedData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract data");
    } finally {
      setIsExtracting(false);
    }
  };

  /**
   * Handle form submission
   *
   * Called by EventForm when user submits the reviewed event data
   * Creates a new event in the database via POST /api/events
   *
   * @param formData - The event data from the form
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

    try {
      // Create event via API
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          imageUrl, // Include the uploaded image URL
        }),
      });

      // Handle save errors
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save event");
      }

      // Redirect to the newly created event's detail page
      const event = await response.json();
      router.push(`/events/${event.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Page Header */}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Upload Event Poster
      </h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Upload an image of an event poster and we&apos;ll extract the details
        automatically.
      </p>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Conditional Content based on extraction state */}
      {!extractedData ? (
        // STEP 1: Image Upload
        // Show uploader with loading overlay during extraction
        <ImageUploader onUpload={handleImageUpload} isLoading={isExtracting} />
      ) : (
        // STEP 2: Review Extracted Data
        // Show form pre-filled with AI-extracted data
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Review Event Details</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            We extracted these details from your poster. Please review and edit
            if needed.
          </p>
          <EventForm
            initialData={extractedData}
            imageUrl={imageUrl || undefined}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      )}

      {/* Reset Button - shown after extraction to start over */}
      {extractedData && (
        <button
          onClick={() => {
            // Reset all state to initial
            setExtractedData(null);
            setImageUrl(null);
          }}
          className="mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          Upload a different image
        </button>
      )}
    </div>
  );
}
