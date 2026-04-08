import { NextResponse } from "next/server";
import addData from "@/firebase/firestore/addData";
import { withRetry } from '@/utils/backoff';
import { uploadFile } from "@/lib/storage";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // Extract form fields
    const imageName = formData.get("username")?.toString();
    const file = formData.get("file") as File | null;

    // Validate required fields
    if (!imageName || !file) {
      return NextResponse.json(
        { message: "Missing required fields: username or file" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to Cloudinary
    const { url: fileUrl } = await withRetry(
      () => uploadFile(buffer, file.name, "linknest"),
      {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 5000,
      }
    );

    // Save image data to Firestore with retry
    const imageData = { imageName, fileUrl };
    const { result, error } = await withRetry(
      () => addData("images", imageData),
      {
        maxAttempts: 3,
        initialDelay: 500,
        maxDelay: 3000
      }
    );

    if (error) {
      console.error("Firestore error:", error);
      return NextResponse.json(
        { message: "Failed to save image data", error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: "Image uploaded successfully", 
        imageId: result, 
        fileUrl 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
