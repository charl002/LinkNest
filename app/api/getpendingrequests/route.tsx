/**
 * @route GET /api/getpendingrequests
 * @description Retrieves a list of pending friend requests for a specific user (receiver).
 *
 * @query {string} username - The username of the receiver to fetch pending requests for.
 *
 * @returns {200 OK} JSON with an array of usernames who sent pending friend requests.
 * @returns {400 Bad Request} If the username query parameter is missing.
 * @returns {401 Unauthorized} If the user is not authenticated.
 * @returns {403 Forbidden} If the user is not authorized to access the data.
 * @returns {404 Not Found} If no pending requests are found.
 * @returns {500 Internal Server Error} If an error occurs during data fetching.
 */
import { NextResponse } from "next/server";
import { getAllDocuments } from "@/firebase/firestore/getData";
import { withRetry } from '@/utils/backoff';
import { authenticateRequest, authorizeUser } from "@/lib/authMiddleware";

interface FriendRequest {
  receiverUsername: string;
  senderUsername: string;
  status: string;
}

export async function GET(req: Request) {
    try {
        // Check authentication
        const authError = await authenticateRequest();
        if (authError) return authError;

        const { searchParams } = new URL(req.url);
        const receiverUsername = searchParams.get("username");

        if (!receiverUsername) {
            return NextResponse.json({ message: "Missing username parameter" }, { status: 400 });
        }

        // Authorize the user
        const authzError = await authorizeUser(receiverUsername);
        if (authzError) return authzError;

        const { results, error } = await withRetry(
            () => getAllDocuments("friend_requests"),
            {
                maxAttempts: 3,
                initialDelay: 500,
                maxDelay: 3000
            }
        );
        if (error || !results) {
            return NextResponse.json({ message: "Error fetching friend requests", error }, { status: 500 });
        }

        if (results.empty) {
            return NextResponse.json({ message: "No pending requests found" }, { status: 404 });
        }

        const pendingRequests = results.docs
            .map(doc => ({ id: doc.id, ...(doc.data() as FriendRequest) })) // Explicitly casting to FriendRequest
            .filter(request => request.receiverUsername === receiverUsername && request.status === "pending")
            .map(request => request.senderUsername); // Only return sender usernames

        return NextResponse.json({ pendingRequests }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ 
            message: "Unexpected error occurred", 
            error: err instanceof Error ? err.message : 'Unknown error'
        }, { status: 500 });
    }
}
