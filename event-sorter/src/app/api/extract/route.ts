import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { aiService } from "@/services/ai-service";
import { readFile } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: "No image URL provided" },
        { status: 400 }
      );
    }

    // Read the image file and convert to base64
    const imagePath = path.join(process.cwd(), "public", imageUrl);
    const imageBuffer = await readFile(imagePath);
    const base64Image = imageBuffer.toString("base64");

    // Determine mime type from extension
    const ext = imageUrl.split(".").pop()?.toLowerCase();
    const mimeType =
      ext === "png"
        ? "image/png"
        : ext === "gif"
          ? "image/gif"
          : ext === "webp"
            ? "image/webp"
            : "image/jpeg";

    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    // Extract event data using AI
    const extractedData = await aiService.extractEventData(dataUrl);

    return NextResponse.json(extractedData);
  } catch (error) {
    console.error("Extract error:", error);
    return NextResponse.json(
      { error: "Failed to extract event data" },
      { status: 500 }
    );
  }
}
