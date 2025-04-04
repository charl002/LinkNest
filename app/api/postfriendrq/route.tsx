/**
 * @route POST /api/postfriendrq
 * @description Sends a new friend request between two users if one does not already exist.
 *
 * @body {string} senderUsername - The username of the user sending the friend request.
 * @body {string} receiverUsername - The username of the user receiving the friend request.
 *
 * @returns {200 OK} If the friend request was successfully created.
 * @returns {400 Bad Request} If usernames are missing or a request already exists.
 * @returns {500 Internal Server Error} If an error occurred while processing the request.
 */
import { NextResponse } from "next/server";
import addData from "@/firebase/firestore/addData";
import { getFriendRequests } from "@/firebase/firestore/getData";
import { withRetry } from '@/utils/backoff';


export async function POST(req: Request) {
    try {
        const { senderUsername, receiverUsername } = await req.json();

        if (!senderUsername || !receiverUsername) {
            return NextResponse.json({ message: "Both usernames are required" }, { status: 400 });
        }

        const { data, error: fetchError } = await withRetry(
            () => getFriendRequests(),
            {
                maxAttempts: 3,
                initialDelay: 500,
                maxDelay: 3000
            }
        );

      if (fetchError) {
        return NextResponse.json({ message: "Error retrieving friend requests", error: fetchError }, { status: 500 });
      }

      const isDuplicate = data?.some(req => 
        (req.senderUsername === senderUsername && req.receiverUsername === receiverUsername) ||
        (req.senderUsername === receiverUsername && req.receiverUsername === senderUsername)
      );

      if (isDuplicate) {
        return NextResponse.json({ message: "Friend request already sent" }, { status: 400 });
      }

      const dataResponse = { senderUsername, receiverUsername, status: "pending" };

      const { result: docId, error } = await withRetry(
            () => addData("friend_requests", dataResponse),
            {
                maxAttempts: 3,
                initialDelay: 500,
                maxDelay: 3000
            }
        );

      if (error) {
        return NextResponse.json({ message: "Error adding friend request", error }, { status: 500 });
      }

      return NextResponse.json({ message: "Friend request sent", id: docId }, { status: 200 });
    } catch (err) {
      return NextResponse.json({ message: "Unexpected error occurred", error: err }, { status: 500 });
    }
}