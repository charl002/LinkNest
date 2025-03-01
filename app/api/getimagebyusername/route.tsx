import { NextResponse } from "next/server";
import { getAllDocuments } from "@/firebase/firestore/getData";

export async function GET(request: Request) {
  try {
    // Extract username from query parameters
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { message: "Username is required" },
        { status: 400 }
      );
    }

    // Fetch all images from Firestore
    const { results, error } = await getAllDocuments("images");

    if (error) {
      console.error("Firestore error:", error);
      return NextResponse.json(
        { message: "Failed to retrieve images", error: error },
        { status: 500 }
      );
    }

    if (!results || results.empty) {
      return NextResponse.json(
        { message: "No images found" },
        { status: 404 }
      );
    }

    // Filter images by username
    const userImages = results.docs
      .map((doc) => doc.data())
      .filter((image) => image.username === username);

    if (userImages.length === 0) {
      return NextResponse.json(
        { message: "No image found for this username" },
        { status: 404 }
      );
    }

    // Return the latest uploaded image by the user
    return NextResponse.json(
      { 
        message: "Image retrieved successfully", 
        fileUrl: userImages[0].fileUrl 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
