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
const SYSTEM_PROMPT = `You are a friendly event creation assistant for Event Sorter. Your job is to help the user create an event or reminder through a natural conversation.

You need to collect the following information:
1. EVENT NAME - What is the event called?
2. DATE - When is it? (get a specific date)
3. TIME - What time? If the user doesn't know or doesn't have a set time, that's fine — accept "none".
4. LOCATION - Where is it happening? If the user doesn't know, accept "none".
5. WITH WHO - Who are they going with? This will be added to the event description. If the user doesn't know or is going alone, accept "none".

Rules:
- Be conversational, friendly, and concise. Keep responses short (1-3 sentences).
- Ask for one or two pieces of information at a time, don't overwhelm the user.
- Start by asking what event or reminder they want to create.
- If the user gives multiple pieces of info at once, acknowledge them and ask for whatever is still missing.
- When the user says they don't have a time, location, or companions, accept that and move on.
- Today's date is ${new Date().toISOString().split("T")[0]}. Use this to interpret relative dates like "tomorrow", "next Friday", etc.

IMPORTANT: Once you have ALL the required information, you MUST respond with ONLY a JSON block in this exact format (no other text before or after):
\`\`\`json
{
  "eventReady": true,
  "name": "Event Name",
  "date": "YYYY-MM-DD",
  "time": "HH:MM or none",
  "location": "Location or none",
  "withWho": "Person names or none",
  "description": "A brief description including who they are going with if applicable"
}
\`\`\`

Do NOT output the JSON until you have confirmed all details with the user. Before outputting the JSON, summarize the event details and ask the user to confirm. Only after they confirm, output the JSON block.`;

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
