// app/api/postuploadpost/route.ts
import { NextResponse } from "next/server";
import addData from "@/firebase/firestore/addData";
import { withRetry } from '@/utils/backoff';
import cache from "@/lib/cache";
import { uploadFile } from "@/lib/storage";
import { getMissingCloudinaryEnvVars } from "@/lib/storage/cloudinary";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // Extract form fields
    const username = formData.get("username")?.toString();
    const title = formData.get("title")?.toString();
    const text = formData.get("text")?.toString();
    const tags = formData.getAll("tags").map(tag => tag.toString());
    const file = formData.get("file") as File | null;
    const createdAt = new Date().toISOString();

    // Validate required fields
    if (!username || !title || !text || !createdAt) {
      return NextResponse.json(
        { message: "Missing required fields: username, title, text, or date" },
        { status: 400 }
      );
    }

    const postData = {
      username,
      title,
      text,
      createdAt,
      tags: tags || [],
      likes: 0,
      comments: [],
      fileUrl: null as string | null,
    };

    if (file && file.size > 0) {
      const missingCloudinaryEnvVars = getMissingCloudinaryEnvVars();
      if (missingCloudinaryEnvVars.length > 0) {
        console.error(
          "[POST_UPLOAD] Missing Cloudinary env vars:",
          missingCloudinaryEnvVars.join(", ")
        );
        return NextResponse.json(
          {
            message: "Cloudinary configuration is missing",
            missingEnvVars: missingCloudinaryEnvVars,
          },
          { status: 500 }
        );
      }

      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer());

      // Upload to Cloudinary with retry
      const { url: uploadedUrl } = await withRetry(
        () => uploadFile(buffer, file.name, "linknest/posts"),
        {
          maxAttempts: 3,
          initialDelay: 1000,
          maxDelay: 5000
        }
      );

      // Add file URL to post data
      postData.fileUrl = uploadedUrl;
    }

    // Add post data to Firestore
    const { result, error } = await withRetry(
        () => addData("posts", postData),
        {
            maxAttempts: 3,
            initialDelay: 500,
            maxDelay: 3000
        }
    );
    
    if (error) {
      console.error("Firestore error:", error);
      return NextResponse.json(
        { message: "Failed to save post data", error: error.message },
        { status: 500 }
      );
    }

    cache.del("user-posts");
    console.log("[CACHE INVALIDATION] user-posts cleared due to new post.");

    return NextResponse.json(
      { 
        message: "Post created successfully", 
        postId: result, 
        fileUrl: postData.fileUrl 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("[POST_UPLOAD] Server error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
