/**
 * URL-Based Event Extraction API Route
 *
 * Handles extracting event information from a webpage URL using AI:
 * - POST /api/extract-url - Fetch a webpage and extract event data from its content
 *
 * This endpoint takes a URL, fetches the webpage content,
 * and uses OpenAI's GPT-4o to extract event details like name, date, time, location, etc.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { aiService } from "@/services/ai-service";

/**
 * POST /api/extract-url
 *
 * Extracts event information from a webpage URL using AI.
 *
 * Process:
 * 1. Validate user is authenticated
 * 2. Validate the provided URL
 * 3. Fetch the webpage content
 * 4. Extract text content from the HTML
 * 5. Send to AI service for analysis
 * 6. Return extracted event data
 *
 * Request body:
 * - url: The URL of the event page to extract from
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
    // Extract the URL from the request body
    const { url } = await request.json();

    // Validate that a URL was provided
    if (!url) {
      return NextResponse.json(
        { error: "No URL provided" },
        { status: 400 }
      );
    }

    // Validate URL format
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      // Only allow http and https protocols
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        throw new Error("Invalid protocol");
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid URL. Please provide a valid http or https URL." },
        { status: 400 }
      );
    }

    // Fetch the webpage content
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        // Identify as a browser to avoid being blocked by some sites
        "User-Agent": "Mozilla/5.0 (compatible; EventSorter/1.0)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      // Follow redirects
      redirect: "follow",
      // Timeout after 10 seconds using AbortSignal
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch the URL (status ${response.status}). Make sure the URL is accessible.` },
        { status: 400 }
      );
    }

    // Get the HTML content
    const html = await response.text();

    // Strip HTML tags and extract meaningful text content
    // Remove script and style elements first, then strip remaining tags
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "") // Remove scripts
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")   // Remove styles
      .replace(/<[^>]+>/g, " ")                           // Remove HTML tags
      .replace(/&nbsp;/g, " ")                            // Replace HTML entities
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")                               // Collapse whitespace
      .trim();

    // Check if we got any meaningful content
    if (textContent.length < 50) {
      return NextResponse.json(
        { error: "Could not extract enough content from this URL. The page might be empty or require JavaScript to load." },
        { status: 400 }
      );
    }

    // Send the text content to the AI service for analysis
    // Include the original URL so the AI can use it as the ticketUrl
    const contentWithUrl = `Source URL: ${url}\n\n${textContent}`;
    const extractedData = await aiService.extractEventDataFromText(contentWithUrl);

    // If no ticketUrl was extracted, use the source URL
    if (!extractedData.ticketUrl) {
      extractedData.ticketUrl = url;
    }

    // Return the extracted event data
    return NextResponse.json(extractedData);
  } catch (error) {
    console.error("Extract from URL error:", error);

    // Handle timeout errors specifically
    if (error instanceof DOMException && error.name === "TimeoutError") {
      return NextResponse.json(
        { error: "The URL took too long to respond. Please try again." },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: "Failed to extract event data from URL" },
      { status: 500 }
    );
  }
}
