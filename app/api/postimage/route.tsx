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

    // Generate unique blob name
    const blobName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '-')}`;
    const blobClient = containerClient.getBlockBlobClient(blobName);

    // Upload to Azure Blob Storage with retry
    try {
      await withRetry(
        async () => {
          const response = await blobClient.uploadData(buffer, {
            blobHTTPHeaders: { blobContentType: file.type },
          });
          if (!response) throw new Error('Upload failed');
          return response;
        },
        {
          maxAttempts: 3,
          initialDelay: 1000,
          maxDelay: 5000
        }
      );
    } catch (error) {
      console.error("Azure upload error:", error);
      throw new Error('Failed to upload file to Azure');
    }

    // Construct file URL
    const fileUrl = `${blobPublicUrl}${encodeURIComponent(blobName)}`;

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
