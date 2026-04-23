import { NextResponse } from "next/server";
import deleteData from "@/firebase/firestore/deleteData";
import { withRetry } from "@/utils/backoff";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import firebase_app from "@/firebase/config";
import { deleteFile } from "@/lib/storage";

const db = getFirestore(firebase_app);

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

    // Delete file from Cloudinary if it exists (only for user posts)
    if (postType === 'posts' && postData.fileUrl) {
      await withRetry(
        () => deleteFile(postData.fileUrl),
        {
          maxAttempts: 3,
          initialDelay: 1000,
          maxDelay: 5000,
        }
      );
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
