/**
 * @route PUT /api/putlikes
 * @description Updates the like count for a specific post. Handles both incrementing and decrementing likes.
 *
 * @requestBody JSON {
 *   id: string;         // ID of the post to update (required)
 *   type: string;       // Type of the post (e.g., "posts", "news", "bluesky") (required)
 *   increment: boolean; // Whether to increment (true) or decrement (false) the like count (required)
 *   username: string;   // The user performing the like action (required)
 * }
 *
 * @returns {200 OK} If the like count is successfully updated.
 * @returns {400 Bad Request} If required parameters are missing.
 * @returns {401 Unauthorized} If user is not authenticated.
 * @returns {403 Forbidden} If user is not authorized.
 * @returns {500 Internal Server Error} If the update fails.
 */
import { NextResponse } from "next/server";
import { incrementLikes } from "@/firebase/firestore/updateLikes";
import { withRetry } from '@/utils/backoff';
import cache from "@/lib/cache";
import { authenticateRequest, authorizeUser } from "@/lib/authMiddleware";

export async function PUT(req: Request) {
    try {
        // Check authentication
        const authError = await authenticateRequest();
        if (authError) return authError;

        const { id, type, increment, username } = await req.json();

        // Authorize the user
        const authzError = await authorizeUser(username);
        if (authzError) return authzError;

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

        cache.del(`${type}-posts`);
        console.log(`[CACHE INVALIDATION] ${type}-posts cleared due to like update.`);

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