"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import EventForm from "@/components/EventForm";
import { ExtractedEventData } from "@/types";

export default function UploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedEventData | null>(
    null
  );
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === "loading") {
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

  const handleImageUpload = async (url: string) => {
    setImageUrl(url);
    setError(null);
    setIsExtracting(true);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to extract event data");
      }

      const data = await response.json();
      setExtractedData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract data");
    } finally {
      setIsExtracting(false);
    }
  };

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
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          imageUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save event");
      }

      const event = await response.json();
      router.push(`/events/${event.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Upload Event Poster
      </h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Upload an image of an event poster and we&apos;ll extract the details
        automatically.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {!extractedData ? (
        <ImageUploader onUpload={handleImageUpload} isLoading={isExtracting} />
      ) : (
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

      {extractedData && (
        <button
          onClick={() => {
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
