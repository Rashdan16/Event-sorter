import OpenAI from "openai";
import { ExtractedEventData } from "@/types";

interface AIProvider {
  extractEventData(imageBase64: string): Promise<ExtractedEventData>;
}

class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async extractEventData(imageBase64: string): Promise<ExtractedEventData> {
    const response = await this.client.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are an event information extractor. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
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
                url: imageBase64.startsWith("data:")
                  ? imageBase64
                  : `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    try {
      // Clean up response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();

      const parsed = JSON.parse(cleanContent);
      return {
        name: parsed.name || null,
        date: parsed.date || null,
        time: parsed.time || null,
        location: parsed.location || null,
        ticketUrl: parsed.ticketUrl || null,
        description: parsed.description || null,
      };
    } catch (e) {
      console.error("AI response content:", content);
      throw new Error(`Failed to parse AI response as JSON: ${e}`);
    }
  }
}

// Export a singleton instance - can be swapped for different providers
export const aiService: AIProvider = new OpenAIProvider
