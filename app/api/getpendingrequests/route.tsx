import { NextResponse } from "next/server";
import { getAllDocuments } from "@/firebase/firestore/getData";
import { withRetry } from '@/utils/backoff';

interface FriendRequest {
  receiverUsername: string;
  senderUsername: string;
  status: string;
}

/**
 * @swagger
 * /api/getpendingrequests:
 *   get:
 *     summary: Get pending friend requests for a user
 *     description: Retrieves all pending friend requests where the given username is the receiver.
 *     tags:
 *      - Friend Requests
 *     parameters:
 *       - in: query
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: The username of the user receiving friend requests
 *     responses:
 *       200:
 *         description: A list of sender usernames who sent pending requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pendingRequests:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Missing username parameter
 *       404:
 *         description: No pending requests found
 *       500:
 *         description: Unexpected server error
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const receiverUsername = searchParams.get("username");

        if (!receiverUsername) {
            return NextResponse.json({ message: "Missing username parameter" }, { status: 400 });
        }

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
