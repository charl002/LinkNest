import { NextResponse } from "next/server";
import updateArrayField from "@/firebase/firestore/updateData";
import { withRetry } from '@/utils/backoff';


/**
 * @swagger
 * /api/addcomment:
 *   post:
 *     summary: Add a comment to a post
 *     description: Adds a new comment to the specified post in Firestore.
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
 *               - postType
 *             properties:
 *               postId:
 *                 type: string
 *                 example: "abc123"
 *               username:
 *                 type: string
 *                 example: "john_doe"
 *               comment:
 *                 type: string
 *                 example: "This post is amazing!"
 *               postType:
 *                 type: string
 *                 description: The Firestore collection (e.g., posts, news, bluesky)
 *                 example: "posts"
 *     responses:
 *       200:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: comment added successfully
 *                 id:
 *                   type: string
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server or Firestore error
 */
export async function POST(req: Request) {
    try {
        const { postId, username, comment, postType } = await req.json();

        if (!postId || !username || !comment || !postType) {
            return NextResponse.json({ message: "Email, name, username, and image are required" }, { status: 400 });
        }

        const now = new Date();
        const datePart = now.toISOString().split("T")[0]; 
        const timePart = now.toLocaleString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
        });
        const date = `${datePart} ${timePart}`

        const newComment = { 
            username,
            comment,
            likes: 0,
            date,
            likedBy: [],
        };

        const { result: docId, error } = await withRetry(
            () => updateArrayField(postType, postId, "comments", newComment),
            {
                maxAttempts: 3,
                initialDelay: 500,
                maxDelay: 3000
            }
        );

        if (error) {
            return NextResponse.json({ message: "Error adding comment", error }, { status: 500 });
        }

        return NextResponse.json({ message: "comment added successfully", id: docId }, { status: 200 });

    } catch (err) {
        return NextResponse.json({ message: "Unexpected error occurred", error: err }, { status: 500 });
    }
}

