import { NextResponse } from "next/server";
import { getFirestore, doc, getDoc, updateDoc, arrayRemove, DocumentReference, DocumentData } from "firebase/firestore";
import firebase_app from "@/firebase/config";
import { Comment } from "@/types/comment";

const db = getFirestore(firebase_app);
const collections = ["posts", "bluesky", "news"];

/**
 * @swagger
 * /api/deletecomment:
 *   post:
 *     summary: Delete a comment from a post
 *     description: Deletes a comment by username, comment text, and date from posts, bluesky, or news collections.
 *     tags:
 *       - Comments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postId
 *               - username
 *               - comment
 *               - date
 *             properties:
 *               postId:
 *                 type: string
 *                 description: The ID of the post
 *               username:
 *                 type: string
 *                 description: The username who posted the comment
 *               comment:
 *                 type: string
 *                 description: The content of the comment
 *               date:
 *                 type: string
 *                 description: The date the comment was posted
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Comment deleted successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Post or comment not found
 *       500:
 *         description: Internal server error
 */
export async function POST(request: Request) {
  try {
    const { postId, username, comment, date } = await request.json();

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
