"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import EventForm from "@/components/EventForm";
import { ExtractedEventData } from "@/types";

type InputMethod = "image" | "url";

export default function UploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [inputMethod, setInputMethod] = useState<InputMethod>("image");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedEventData | null>(
    null
  );
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");

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

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;

    setError(null);
    setIsExtracting(true);

    try {
      const response = await fetch("/api/extract-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to extract event data from URL");
      }

      const data = await response.json();
      setExtractedData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract data from URL");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = async (formData: {
    name: string;
    description: string;
    location: string;
    date: string;
    endDate: string;
    time: string;
    ticketUrl: string;
    price: string;
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
      router.push(`/event-sorter/events/${event.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = async () => {
    setExtractedData(null);
    setError(null);
    setIsExtracting(true);

    try {
      if (inputMethod === "image" && imageUrl) {
        const response = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl }),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to extract event data");
        }
        const data = await response.json();
        setExtractedData(data);
      } else if (inputMethod === "url" && urlInput.trim()) {
        const response = await fetch("/api/extract-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: urlInput.trim() }),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to extract event data from URL");
        }
        const data = await response.json();
        setExtractedData(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract data");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleReset = () => {
    setExtractedData(null);
    setImageUrl(null);
    setUrlInput("");
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Add Event
      </h1>
      <p className="text-gray-600 dark:text-gray-300 mb-8">
        Upload an event poster or paste a URL to extract details automatically.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {!extractedData ? (
        <>
          {!isExtracting && (
            <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden mb-6">
              <button
                onClick={() => { setInputMethod("image"); setError(null); }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition ${
                  inputMethod === "image"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Upload Image
              </button>
              <button
                onClick={() => { setInputMethod("url"); setError(null); }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-l border-gray-300 dark:border-gray-600 transition ${
                  inputMethod === "url"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Paste URL
              </button>
            </div>
          )}

          {inputMethod === "image" && (
            <ImageUploader onUpload={handleImageUpload} isLoading={isExtracting} />
          )}

          {inputMethod === "url" && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              {isExtracting ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-gray-600 dark:text-gray-300 font-medium">
                    Extracting event details...
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Fetching and analyzing the page content
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                    Event Page URL
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Paste a link to an event page and we&apos;ll extract the details automatically.
                  </p>

                  <div className="flex gap-3">
                    <input
                      type="url"
                      placeholder="https://example.com/event"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleUrlSubmit();
                        }
                      }}
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    />
                    <button
                      onClick={handleUrlSubmit}
                      disabled={!urlInput.trim()}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    >
                      Extract
                    </button>
                  </div>

                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                    Works with event pages from Eventbrite, Meetup, Facebook Events, and most event websites.
                  </p>
                </>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Review Event Details</h2>
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            We extracted these details{inputMethod === "url" ? " from the URL" : " from your poster"}. Please review and edit
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
          onClick={handleReset}
          className="mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          {inputMethod === "url" ? "Try a different URL" : "Upload a different image"}
        </button>
      )}
    </div>
  );
}
