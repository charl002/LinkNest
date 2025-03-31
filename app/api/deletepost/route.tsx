import { BlobServiceClient } from "@azure/storage-blob";
import { NextResponse } from "next/server";
import deleteData from "@/firebase/firestore/deleteData";
import { withRetry } from "@/utils/backoff";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import firebase_app from "@/firebase/config";

const sasToken = process.env.AZURE_SAS;
const containerName = process.env.AZURE_BLOB_CONTAINER || "helloblob";
const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT || "webprojazure";

const blobService = new BlobServiceClient(
  `https://${storageAccountName}.blob.core.windows.net/?${sasToken}`
);
const containerClient = blobService.getContainerClient(containerName);
const db = getFirestore(firebase_app);

/**
 * @swagger
 * /api/deletepost:
 *   delete:
 *     summary: Delete a post by ID
 *     description: Deletes a post from Firestore and optionally its image from Azure Blob Storage (if postType is 'posts').
 *     tags:
 *      - Posts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postId
 *               - postType
 *             properties:
 *               postId:
 *                 type: string
 *                 description: The ID of the post to delete.
 *               postType:
 *                 type: string
 *                 description: The Firestore collection of the post (e.g., "posts", "news", "bluesky").
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
export async function DELETE(request: Request) {
  try {
    const { postId, postType } = await request.json();
    if (!postId || !postType) {
      return NextResponse.json(
        { message: "Missing required fields: postId and postType" },
        { status: 400 }
      );
    }

    // Retrieve post data to get file URL
    const postRef = doc(db, postType, postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) {
      return NextResponse.json(
        { message: "Post not found" },
        { status: 404 }
      );
    }

    const postData = postSnap.data();

    // Delete file from Azure Blob Storage if it exists (only for user posts)
    if (postType === 'posts' && postData.fileUrl) {
      const fileName = decodeURIComponent(postData.fileUrl.split("/").pop());
      const blobClient = containerClient.getBlockBlobClient(fileName);
      
      await withRetry(() => blobClient.deleteIfExists(), {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 5000,
      });
    }

    // Delete post from Firestore
    const { success, error } = await withRetry(
      () => deleteData(postType, postId),
      {
        maxAttempts: 3,
        initialDelay: 500,
        maxDelay: 3000,
      }
    );

    if (!success) {
      return NextResponse.json(
        { message: "Failed to delete post", error: error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Post deleted successfully" },
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
