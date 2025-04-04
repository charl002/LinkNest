/**
 * @route PUT /api/putcommentlikes
 * @description Updates the like count on a specific comment within a post.
 *              Supports both incrementing and decrementing likes.
 *
 * @requestBody JSON {
 *   id: string;            // The ID of the post containing the comment (required)
 *   type: string;          // The post collection type (e.g., "posts", "news", "bluesky") (required)
 *   increment: boolean;    // Whether to increment (true) or decrement (false) the like count (required)
 *   username: string;      // The username of the user performing the like action (required)
 *   commentIndex: number;  // Index of the comment within the post's comments array (required)
 * }
 *
 * @returns {200 OK} If the like count is successfully updated.
 * @returns {400 Bad Request} If any required fields are missing.
 * @returns {401 Unauthorized} If the user is not authenticated.
 * @returns {403 Forbidden} If the user is not authorized.
 * @returns {500 Internal Server Error} If the operation fails.
 */
import { NextResponse } from "next/server";
import { incrementCommentLikes } from "@/firebase/firestore/updateCommentLikes";
import { withRetry } from '@/utils/backoff';
import cache from "@/lib/cache";
import { authenticateRequest, authorizeUser } from "@/lib/authMiddleware";

export async function PUT(req: Request) {
    try {
        // Check authentication
        const authError = await authenticateRequest();
        if (authError) return authError;

        const { id, type, increment, username, commentIndex } = await req.json();

        // Authorize the user
        const authzError = await authorizeUser(username);
        if (authzError) return authzError;

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

        cache.del(`${type}-posts`);
        console.log(`[CACHE INVALIDATION] ${type}-posts cleared due to comment like update.`);

        return NextResponse.json({ message }, { status: 200 });
    } catch (error) {
        const err = error as Error;
        console.error('Error in PUT /api/putcommentlikes:', err);
        return NextResponse.json({ message: 'An error occurred', error: err.message }, { status: 500 });
    }
}