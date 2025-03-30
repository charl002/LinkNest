import { NextResponse } from "next/server";
import { incrementCommentLikes } from "@/firebase/firestore/updateCommentLikes";
import { withRetry } from '@/utils/backoff';

/**
 * @swagger
 * /api/putcommentlikes:
 *   put:
 *     summary: Like or unlike a comment
 *     description: Increments or decrements the number of likes on a specific comment by index.
 *     tags:
 *       - Comments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - type
 *               - increment
 *               - username
 *               - commentIndex
 *             properties:
 *               id:
 *                 type: string
 *                 description: ID of the post or document containing the comment
 *                 example: "abc123"
 *               type:
 *                 type: string
 *                 description: Collection name (e.g., "posts", "news")
 *                 example: "posts"
 *               increment:
 *                 type: boolean
 *                 description: Whether to increment (true) or decrement (false) the like count
 *                 example: true
 *               username:
 *                 type: string
 *                 description: Username of the person liking or unliking
 *                 example: "john_doe"
 *               commentIndex:
 *                 type: integer
 *                 description: Index of the comment in the post's comment array
 *                 example: 2
 *     responses:
 *       200:
 *         description: Like updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Comment like updated"
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
export async function PUT(req: Request) {
    try {
        const { id, type, increment, username, commentIndex } = await req.json();

        // Validate input
        if (!id || commentIndex === undefined || !username) {
            return NextResponse.json({ message: 'Missing id, commentIndex, or username' }, { status: 400 });
        }

        // Call the incrementCommentLikes function
        const message = await withRetry(
            () => incrementCommentLikes(id, type, increment, username, commentIndex),
            {
                maxAttempts: 3,
                initialDelay: 500,
                maxDelay: 3000
            }
        );

        return NextResponse.json({ message }, { status: 200 });
    } catch (error) {
        const err = error as Error;
        console.error('Error in PUT /api/putcommentlikes:', err);
        return NextResponse.json({ message: 'An error occurred', error: err.message }, { status: 500 });
    }
}