import { NextResponse } from "next/server";
import { incrementLikes } from "@/firebase/firestore/updateLikes"; // Adjust the import path as necessary
import { withRetry } from '@/utils/backoff';


/**
 * @swagger
 * /api/putlikes:
 *   put:
 *     summary: Like or unlike a post
 *     description: Updates the like count of a post (or removes a like) and records the user who liked/unliked.
 *     tags:
 *       - Posts
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
 *             properties:
 *               id:
 *                 type: string
 *                 description: ID of the post to update
 *                 example: "abc123"
 *               type:
 *                 type: string
 *                 enum: [posts, bluesky, news]
 *                 description: Type of post
 *                 example: "posts"
 *               increment:
 *                 type: boolean
 *                 description: Set to true to like, false to unlike
 *                 example: true
 *               username:
 *                 type: string
 *                 description: Username of the user liking/unliking the post
 *                 example: "johndoe"
 *     responses:
 *       200:
 *         description: Post like updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post like updated"
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
export async function PUT(req: Request) {
    try {
        const { id, type, increment, username } = await req.json(); // Expecting { id: string, type: 'posts' | 'bluesky' | 'news', increment: boolean, username: string }

        // Validate input
        if (!id || !type || !username) {
            return NextResponse.json({ message: 'Missing id, type, or username' }, { status: 400 });
        }

        // Call the incrementLikes function
        const message = await withRetry(
            () => incrementLikes(id, type, increment, username),
            {
                maxAttempts: 3,
                initialDelay: 500,
                maxDelay: 3000
            }
        );

        return NextResponse.json({ message }, { status: 200 });
    } catch (error) {
        const err = error as Error; // Type assertion
        console.error('Error in PUT /api/updateLikes:', err);
        return NextResponse.json({ 
            message: 'An error occurred', 
            error: err.message,
            details: err.stack
        }, { status: 500 });
    }
}