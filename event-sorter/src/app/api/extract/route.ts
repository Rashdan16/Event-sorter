/**
 * AI Event Extraction API Route
 *
 * Handles extracting event information from poster images using AI:
 * - POST /api/extract - Extract event data from an uploaded image
 *
 * This endpoint takes an image URL (from a previously uploaded file),
 * reads the image, and uses OpenAI's GPT-4 Vision to extract event details
 * like name, date, time, location, etc.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { aiService } from "@/services/ai-service";
import { readFile } from "fs/promises";
import path from "path";

/**
 * POST /api/extract
 *
 * Extracts event information from an image using AI.
 *
 * Process:
 * 1. Validate user is authenticated
 * 2. Read the image file from disk
 * 3. Convert image to base64 data URL format
 * 4. Send to AI service for analysis
 * 5. Return extracted event data
 *
 * Request body:
 * - imageUrl: The URL path to the uploaded image (e.g., "/uploads/abc123.jpg")
 *
 * @param request - The incoming HTTP request
 * @returns JSON with extracted event data (name, date, time, location, etc.)
 */
export async function POST(request: NextRequest) {
  // Get current user session
  const session = await getServerSession(authOptions);

  // Require authentication
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Extract the image URL from the request body
    const { imageUrl } = await request.json();

    // Validate that an image URL was provided
    if (!imageUrl) {
      return NextResponse.json(
        { error: "No image URL provided" },
        { status: 400 }
      );
    }

    // Build the full file path to the image
    // imageUrl is like "/uploads/abc123.jpg"
    // We need to read from "public/uploads/abc123.jpg"
    const imagePath = path.join(process.cwd(), "public", imageUrl);

    // Read the image file from disk as a Buffer
    const imageBuffer = await readFile(imagePath);

    // Convert the buffer to base64 string
    // Base64 encoding represents binary data as ASCII text
    const base64Image = imageBuffer.toString("base64");

    // Determine the MIME type based on file extension
    // This tells the AI what format the image is in
    const ext = imageUrl.split(".").pop()?.toLowerCase();
    const mimeType =
      ext === "png"
        ? "image/png"
        : ext === "gif"
          ? "image/gif"
          : ext === "webp"
            ? "image/webp"
            : "image/jpeg"; // Default to JPEG for jpg and unknown extensions

    // Create a data URL that combines the MIME type and base64 data
    // Format: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    // Send the image to the AI service for analysis
    // The AI will "look at" the image and extract event information
    const extractedData = await aiService.extractEventData(dataUrl);

    // Return the extracted event data
    // This includes: name, date, time, location, ticketUrl, description
    // Any fields the AI couldn't determine will be null
    return NextResponse.json(extractedData);
  } catch (error) {
    console.error("Extract error:", error);
    return NextResponse.json(
      { error: "Failed to extract event data" },
      { status: 500 }
    );
  }
}
