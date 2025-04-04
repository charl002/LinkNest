/**
 * @route POST /api/postcomment
 * @description Adds a comment to a post in Firestore and invalidates server-side cache for that post type.
 *
 * @auth Requires authentication and authorization of the commenting user.
 *
 * @body {string} postId - The ID of the post being commented on.
 * @body {string} username - The username of the commenter.
 * @body {string} comment - The content of the comment.
 * @body {string} postType - The collection type of the post (e.g., "posts", "news", "bluesky").
 *
 * @returns {200 OK} If the comment was successfully added.
 * @returns {400 Bad Request} If required fields are missing.
 * @returns {401 Unauthorized} If the user is not authenticated.
 * @returns {403 Forbidden} If the user is not authorized.
 * @returns {500 Internal Server Error} If there was an error adding the comment.
 */
import { NextResponse } from "next/server";
import updateArrayField from "@/firebase/firestore/updateData";
import { withRetry } from '@/utils/backoff';
import cache from "@/lib/cache";
import { authenticateRequest, authorizeUser } from "@/lib/authMiddleware";

export async function POST(req: Request) {
    try {
        // Check authentication
        const authError = await authenticateRequest();
        if (authError) return authError;

        const { postId, username, comment, postType } = await req.json();

        // Authorize the user
        const authzError = await authorizeUser(username);
        if (authzError) return authzError;

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

        cache.del(`${postType}-posts`);
        console.log(`[CACHE INVALIDATION] ${postType}-posts cleared due to new comment.`);

        return NextResponse.json({ message: "comment added successfully", id: docId }, { status: 200 });

    } catch (err) {
        return NextResponse.json({ message: "Unexpected error occurred", error: err }, { status: 500 });
    }
}

