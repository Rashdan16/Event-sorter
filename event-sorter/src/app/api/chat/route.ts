import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * System prompt that instructs the AI to act as an event creation assistant.
 * The AI will conversationally gather: EVENT NAME, DATE, TIME, LOCATION, WITH WHO.
 * When all info is collected, it outputs a JSON block to signal event creation.
 */
const SYSTEM_PROMPT = `You are a quick event creation assistant for Event Sorter. Your job is to create events as fast as possible from what the user tells you.

Today's date is ${new Date().toISOString().split("T")[0]}. Use this to interpret relative dates like "tomorrow", "next Friday", "this Saturday", etc.

RULES:
- Extract ALL information you can from the user's message in one go.
- The only REQUIRED fields are: event NAME and DATE. Everything else is optional.
- If time, location, or companions are not mentioned, default them to "none" — do NOT ask about them.
- If you can infer a reasonable event name from context (e.g. "dinner with Jake" → name is "Dinner with Jake"), do so.
- If you have both a name and a date, immediately output the JSON. Do NOT ask for confirmation. Do NOT summarize. Just create it.
- Only ask a follow-up question if the event NAME or DATE is genuinely impossible to determine from the message. Keep follow-ups to a single short question.
- Be very brief. One sentence max if you need to respond with text.

OUTPUT FORMAT — when you have at minimum a name and date, respond with ONLY this JSON block (no other text):
\`\`\`json
{
  "eventReady": true,
  "name": "Event Name",
  "date": "YYYY-MM-DD",
  "time": "HH:MM or none",
  "location": "Location or none",
  "withWho": "Person names or none",
  "description": "Brief description or none"
}
\`\`\`

Examples of single-message event creation:
- "Dinner with Jake tomorrow at 7pm at Nandos" → immediately output JSON with all fields filled
- "Dentist appointment March 15" → immediately output JSON, time/location/withWho = "none"
- "Football Saturday 3pm" → immediately output JSON, name="Football", date=next Saturday, time="15:00"
- "Meeting" → ask only: "When is it?"
- "Tomorrow" → ask only: "What's the event?"`;

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    // Check if the response contains the event-ready JSON
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const eventData = JSON.parse(jsonMatch[1]);
        if (eventData.eventReady) {
          return NextResponse.json({
            message: content,
            eventData: {
              name: eventData.name,
              date: eventData.date,
              time: eventData.time === "none" ? null : eventData.time,
              location: eventData.location === "none" ? null : eventData.location,
              description: eventData.description || null,
            },
          });
        }
      } catch {
        // JSON parsing failed, treat as normal message
      }
    }

    return NextResponse.json({ message: content, eventData: null });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to get response" },
      { status: 500 }
    );
  }
}
