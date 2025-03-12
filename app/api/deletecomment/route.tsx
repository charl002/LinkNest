import { NextResponse } from "next/server";
import { getFirestore, doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import firebase_app from "@/firebase/config";

const db = getFirestore(firebase_app);

interface Comment {
    username: string;
    comment: string;
    likes: number;
    date: string;
    likedBy: string[];
}

export async function POST(request: Request) {
  try {
    const { postId, username, comment, date } = await request.json();

    if (!postId || !username || !comment || !date) {
      return NextResponse.json(
        { message: "Missing required fields: postId, username, comment, or date" },
        { status: 400 }
      );
    }

    const postRef = doc(db, "posts", postId);
    const postDoc = await getDoc(postRef);

    if (!postDoc.exists()) {
      return NextResponse.json(
        { message: "Post not found" },
        { status: 404 }
      );
    }

    const comments = postDoc.data().comments;
    const commentToDelete = comments.find(
      (c: Comment) =>
        c.username === username &&
        c.comment === comment &&
        c.date === date || "just now"
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