/**
 * File Upload API Route
 *
 * Handles uploading event poster images:
 * - POST /api/upload - Upload an image file
 *
 * Uploaded images are saved to the public/uploads directory
 * with a unique filename to prevent collisions.
 *
 * Note: In production, you'd typically use cloud storage (S3, Cloudinary, etc.)
 * instead of local file storage for better scalability and CDN delivery.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

/**
 * POST /api/upload
 *
 * Uploads an image file to the server.
 *
 * Process:
 * 1. Validate user is authenticated
 * 2. Extract file from multipart form data
 * 3. Validate file type (images only)
 * 4. Generate unique filename to prevent overwrites
 * 5. Save file to public/uploads directory
 * 6. Return the URL to access the uploaded image
 *
 * Request: multipart/form-data with 'file' field
 *
 * @param request - The incoming HTTP request with form data
 * @returns JSON with imageUrl, or error response
 */
export async function POST(request: NextRequest) {
  // Get current user session
  const session = await getServerSession(authOptions);

  // Require authentication - only logged-in users can upload
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse the multipart form data from the request
    const formData = await request.formData();

    // Get the file from the 'file' field
    const file = formData.get("file") as File | null;

    // Validate that a file was provided
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // SECURITY: Validate file type to prevent malicious uploads
    // Only allow common image formats
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an image." },
        { status: 400 }
      );
    }

    // Generate a unique filename using UUID to prevent:
    // 1. Filename collisions when multiple users upload
    // 2. Overwriting existing files
    // 3. Predictable URLs (minor security benefit)
    const ext = file.name.split(".").pop();       // Get original extension (jpg, png, etc.)
    const filename = `${randomUUID()}.${ext}`;     // e.g., "a1b2c3d4-e5f6-7890-abcd-ef1234567890.jpg"

    // Build the full path where the file will be saved
    // path.join handles OS-specific path separators (/ vs \)
    const filepath = path.join(process.cwd(), "public", "uploads", filename);

    // Convert the File object to a Buffer for writing to disk
    // File.arrayBuffer() returns the file contents as an ArrayBuffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write the file to disk
    // The uploads directory must exist (created manually or via .gitkeep)
    await writeFile(filepath, buffer);

    // Build the public URL for the uploaded image
    // Files in public/ are served at the root URL
    const imageUrl = `/uploads/${filename}`;

    // Return the URL so the client can use it
    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
