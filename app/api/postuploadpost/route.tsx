// app/api/postuploadpost/route.ts
import { BlobServiceClient } from "@azure/storage-blob";
import { NextResponse } from "next/server";
import addData from "@/firebase/firestore/addData";
import { withRetry } from '@/utils/backoff';

// Azure Storage Configuration
const sasToken = process.env.AZURE_SAS;
const containerName = process.env.AZURE_BLOB_CONTAINER || "helloblob";
const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT || "webprojazure";
const blobPublicUrl = `https://${storageAccountName}.blob.core.windows.net/${containerName}/`;

const blobService = new BlobServiceClient(
  `https://${storageAccountName}.blob.core.windows.net/?${sasToken}`
);
const containerClient = blobService.getContainerClient(containerName);

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
      // Convert file to buffer
      const buffer = Buffer.from(await file.arrayBuffer());
      
      // Generate unique blob name
      const blobName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '-')}`;
      const blobClient = containerClient.getBlockBlobClient(blobName);

      // Upload to Azure Blob Storage with retry
      await withRetry(
        () => blobClient.uploadData(buffer, {
          blobHTTPHeaders: { blobContentType: file.type },
        }),
        {
          maxAttempts: 3,
          initialDelay: 1000,
          maxDelay: 5000
        }
      );

      // Add file URL to post data
      postData.fileUrl = `${blobPublicUrl}${encodeURIComponent(blobName)}`;
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

    return NextResponse.json(
      { 
        message: "Post created successfully", 
        postId: result, 
        fileUrl: postData.fileUrl 
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