import { NextResponse } from "next/server";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import firebase_app from "@/firebase/config";

const db = getFirestore(firebase_app);

/**
 * @swagger
 * /api/clearreports:
 *   post:
 *     summary: Clear all reports from a post
 *     description: Clears the `reports` array for a specific post in the Firestore database.
 *     tags:
 *       - Moderation
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
 *                 description: The ID of the post to clear reports from
 *               postType:
 *                 type: string
 *                 description: The Firestore collection name (e.g., "posts", "news", "bluesky")
 *     responses:
 *       200:
 *         description: Reports cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Reports cleared successfully
 *       400:
 *         description: Missing postId or postType
 *       500:
 *         description: Internal server error
 */
export async function POST(request: Request) {
    try {
        const { postId, postType } = await request.json();

        if (!postId || !postType) {
            return NextResponse.json(
                { message: "Post ID and type are required" },
                { status: 400 }
            );
        }

        const postRef = doc(db, postType, postId);
        await updateDoc(postRef, {
            reports: []
        });

        return NextResponse.json(
            { message: "Reports cleared successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}