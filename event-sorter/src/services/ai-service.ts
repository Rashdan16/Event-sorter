/**
 * AI Service for Event Data Extraction
 *
 * This service uses OpenAI's GPT-4 Vision model to analyze event poster images
 * and extract structured event information (name, date, time, location, etc.).
 *
 * The service follows the Provider pattern, allowing easy swapping of AI providers
 * (e.g., switching from OpenAI to Anthropic) without changing the rest of the app.
 */

import OpenAI from "openai";
import { ExtractedEventData } from "@/types";

/**
 * AIProvider Interface
 *
 * Defines the contract that any AI provider must implement.
 * This allows for easy swapping of AI services without changing consumer code.
 */
interface AIProvider {
  /**
   * Extract event data from a base64-encoded image
   * @param imageBase64 - The image encoded as base64 string (with or without data URL prefix)
   * @returns Promise resolving to extracted event data
   */
  extractEventData(imageBase64: string): Promise<ExtractedEventData>;
}

/**
 * OpenAI Provider Implementation
 *
 * Uses OpenAI's GPT-4o model with vision capabilities to analyze event posters
 * and extract structured event information.
 */
class OpenAIProvider implements AIProvider {
  // OpenAI client instance for making API calls
  private client: OpenAI;

  /**
   * Initialize the OpenAI client with API key from environment variables.
   * The API key should be set in .env as OPENAI_API_KEY
   */
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Extract event information from an image using GPT-4 Vision
   *
   * Process:
   * 1. Send the image to GPT-4o with a structured prompt
   * 2. Request JSON response format for reliable parsing
   * 3. Parse and validate the response
   * 4. Return normalized event data
   *
   * @param imageBase64 - Base64-encoded image (with or without data: prefix)
   * @returns Extracted event data with null for any fields that couldn't be determined
   */
  async extractEventData(imageBase64: string): Promise<ExtractedEventData> {
    // Make API call to OpenAI's chat completions endpoint
    const response = await this.client.chat.completions.create({
      model: "gpt-4o", // GPT-4 with vision capabilities

      // Force JSON response format for reliable parsing
      response_format: { type: "json_object" },

      messages: [
        {
          // System message sets the AI's behavior
          role: "system",
          content: "You are an event information extractor. Always respond with valid JSON only.",
        },
        {
          // User message contains both the prompt and the image
          role: "user",
          content: [
            {
              type: "text",
              // Detailed prompt explaining exactly what to extract and the response format
              text: `Analyze this event poster image and extract the following information. Return a JSON object with these exact fields:
{
  "name": "The name/title of the event",
  "date": "The date in YYYY-MM-DD format",
  "time": "The time in HH:MM format (24-hour)",
  "location": "The venue or location",
  "ticketUrl": "Any URL for tickets or more info",
  "description": "A brief description of the event"
}

If any field cannot be determined from the image, set its value to null.`,
            },
            {
              type: "image_url",
              image_url: {
                // Handle both raw base64 and data URL formats
                // If the image already has data: prefix, use it as-is
                // Otherwise, add the JPEG data URL prefix
                url: imageBase64.startsWith("data:")
                  ? imageBase64
                  : `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000, // Limit response length (JSON should be much shorter)
    });

    // Extract the text content from the response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    try {
      // Clean up the response content
      // Sometimes the AI wraps JSON in markdown code blocks despite instructions
      let cleanContent = content.trim();

      // Remove ```json prefix if present
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }

      // Remove ``` suffix if present
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();

      // Parse the JSON response
      const parsed = JSON.parse(cleanContent);

      // Return normalized data structure
      // Use || null to convert empty strings/undefined to null
      return {
        name: parsed.name || null,
        date: parsed.date || null,
        time: parsed.time || null,
        location: parsed.location || null,
        ticketUrl: parsed.ticketUrl || null,
        description: parsed.description || null,
      };
    } catch (e) {
      // Log the raw content for debugging if JSON parsing fails
      console.error("AI response content:", content);
      throw new Error(`Failed to parse AI response as JSON: ${e}`);
    }
  }
}

/**
 * Singleton AI Service Instance
 *
 * Export a single instance of the AI provider.
 * To switch providers, simply change which class is instantiated here.
 * All consumers import this singleton and use it without knowing the underlying implementation.
 */
export const aiService: AIProvider = new OpenAIProvider
