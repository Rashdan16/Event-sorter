/**
 * ImageUploader Component
 *
 * A drag-and-drop file upload component for event poster images.
 * Handles file selection, validation, preview, and upload to the server.
 *
 * Features:
 * - Drag and drop support
 * - Click to browse files
 * - Image preview before upload completes
 * - File type validation (images only)
 * - File size validation (max 10MB)
 * - Loading state overlay during AI extraction
 * - Error message display
 *
 * This is a client component because it handles user interactions
 * and manages local state for drag/drop, preview, and errors.
 */

"use client";

import { useCallback, useState } from "react";

/**
 * Props for the ImageUploader component
 */
interface ImageUploaderProps {
  onUpload: (imageUrl: string) => void;  // Called with the uploaded image URL
  isLoading?: boolean;                    // Show loading overlay (during AI extraction)
}

/**
 * ImageUploader Component
 *
 * @param onUpload - Callback function called with the server URL after successful upload
 * @param isLoading - When true, shows a loading overlay (used during AI extraction)
 */
export default function ImageUploader({
  onUpload,
  isLoading,
}: ImageUploaderProps) {
  // Track whether user is currently dragging a file over the drop zone
  const [isDragging, setIsDragging] = useState(false);

  // Store the local preview URL (data URL from FileReader)
  const [preview, setPreview] = useState<string | null>(null);

  // Store any error message to display to the user
  const [error, setError] = useState<string | null>(null);

  /**
   * Process and upload a selected file
   * Validates the file, shows preview, and uploads to server
   *
   * useCallback prevents recreation on every render, important because
   * this function is used in event handlers
   */
  const handleFile = useCallback(
    async (file: File) => {
      // Clear any previous error
      setError(null);

      // VALIDATION: Check file type - must be an image
      if (!file.type.startsWith("image/")) {
        setError("Please upload an image file");
        return;
      }

      // VALIDATION: Check file size - max 10MB
      // 10 * 1024 * 1024 = 10,485,760 bytes = 10MB
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }

      // PREVIEW: Read file as data URL for immediate preview
      // This shows the image before upload completes
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // UPLOAD: Send file to server
      // Create FormData object for multipart/form-data upload
      const formData = new FormData();
      formData.append("file", file);

      try {
        // POST to upload endpoint
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        // Handle server errors
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Upload failed");
        }

        // Success - extract the image URL and notify parent
        const data = await response.json();
        onUpload(data.imageUrl);
      } catch (err) {
        // Show error and clear preview on failure
        setError(err instanceof Error ? err.message : "Upload failed");
        setPreview(null);
      }
    },
    [onUpload] // Dependency: recreate if onUpload changes
  );

  /**
   * Handle file drop event
   * Called when user drops a file on the drop zone
   */
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault(); // Prevent browser from opening the file
      setIsDragging(false);

      // Get the first dropped file and process it
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  /**
   * Handle drag over event
   * Called continuously while dragging over the drop zone
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); // Required to allow drop
    setIsDragging(true);
  }, []);

  /**
   * Handle drag leave event
   * Called when dragged file leaves the drop zone
   */
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  /**
   * Handle file input change
   * Called when user selects a file via the file browser
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  return (
    <div className="w-full">
      {/* Drop zone container */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          // Change border/background color when dragging
          isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
        } ${
          // Disable interactions and dim when loading
          isLoading ? "pointer-events-none opacity-50" : ""
        }`}
      >
        {/* Show preview if image is selected, otherwise show upload prompt */}
        {preview ? (
          // IMAGE PREVIEW STATE
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="max-h-64 mx-auto rounded-lg"
            />
            {/* Loading overlay - shown during AI extraction */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 rounded-lg">
                <div className="flex items-center gap-2">
                  {/* Spinning loader */}
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Extracting event info...
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          // UPLOAD PROMPT STATE - no image selected yet
          <>
            {/* Upload icon */}
            <svg
              className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>

            {/* Instructions text */}
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              Drag and drop an event poster here
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">or</p>

            {/* File browser button - label wraps hidden input */}
            <label className="inline-block">
              <span className="bg-blue-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700 transition">
                Choose File
              </span>
              {/* Hidden file input - triggered by clicking the label */}
              <input
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
              />
            </label>
          </>
        )}
      </div>

      {/* Error message display */}
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
      )}
    </div>
  );
}
