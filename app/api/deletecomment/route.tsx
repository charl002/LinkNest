import { NextResponse } from "next/server";
import { getFirestore, doc, getDoc, updateDoc, arrayRemove, DocumentReference, DocumentData } from "firebase/firestore";
import firebase_app from "@/firebase/config";
import { Comment } from "@/types/comment";
import { authenticateRequest, authorizeUser } from "@/lib/authMiddleware";

const db = getFirestore(firebase_app);
const collections = ["posts", "bluesky", "news"];

export async function POST(request: Request) {
    try {
        // Check authentication
        const authError = await authenticateRequest();
        if (authError) return authError;

        const { postId, username, comment, date } = await request.json();

        // Authorize the user
        const authzError = await authorizeUser(username);
        if (authzError) return authzError;

    if (!postId || !username || !comment || !date) {
      return NextResponse.json(
        { message: "Missing required fields: postId, username, comment, or date" },
        { status: 400 }
      );
    }

    let postRef: DocumentReference<DocumentData> | undefined;
    let postDoc: DocumentData | undefined;

    // Iterate through collections to find the post
    for (const collection of collections) {
      const ref = doc(db, collection, postId);
      const docSnap = await getDoc(ref);

      if (docSnap.exists()) {
        postRef = ref;
        postDoc = docSnap.data(); // Extract document data
        break; // Exit loop once found
      }
    }

    if (!postRef || !postDoc) {
      return NextResponse.json(
        { message: "Post not found in any collection" },
        { status: 404 }
      );
    }

    const comments = postDoc.comments ?? [];
    const commentToDelete = comments.find((c: Comment) =>
      c.username === username &&
      c.comment === comment &&
      (c.date === date || date === "Just now")
    );

    if (!commentToDelete) {
      return NextResponse.json(
        { message: "Comment not found" },
        { status: 404 }
      );
    }

    await updateDoc(postRef, {
      comments: arrayRemove(commentToDelete),
    });

    return NextResponse.json(
      { message: "Comment deleted successfully" },
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
