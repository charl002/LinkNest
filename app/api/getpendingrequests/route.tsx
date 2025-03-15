import { NextResponse } from "next/server";
import { getAllDocuments } from "@/firebase/firestore/getData";
import { withRetry } from '@/utils/backoff';

interface FriendRequest {
  receiverUsername: string;
  senderUsername: string;
  status: string;
}

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
