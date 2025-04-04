/**
 * @route POST /api/updatefriendstatus
 * @description Updates the status of a friend request (e.g., "accepted", "rejected").
 *
 * @requestBody JSON {
 *   senderUsername: string;   // Username of the sender (required)
 *   receiverUsername: string; // Username of the receiver (required)
 *   status: string;           // New status of the friend request (e.g., "accepted", "rejected") (required)
 * }
 *
 * @returns {200 OK} If the friend request status was updated successfully.
 * @returns {400 Bad Request} If any required parameter is missing.
 * @returns {404 Not Found} If no matching friend request is found.
 * @returns {500 Internal Server Error} If a server or Firestore error occurs.
 */
import { NextResponse } from "next/server";
import { getFriendRequests } from "@/firebase/firestore/getData";
import { updateFriendRequestStatus } from "@/firebase/firestore/updateStatus";

export async function POST(req: Request) {
    try {
        const { senderUsername, receiverUsername, status } = await req.json();

        if (!senderUsername || !receiverUsername || !status) {
            return NextResponse.json({ message: "Missing parameters" }, { status: 400 });
        }

        const { data, error } = await getFriendRequests();

        if (error) {
            return NextResponse.json({ message: "Error fetching friend requests", error }, { status: 500 });
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ message: "No friend requests found" }, { status: 404 });
        }

        const friendRequest = data.find(
            req => req.senderUsername === senderUsername && req.receiverUsername === receiverUsername
        );

        if (!friendRequest) {
            return NextResponse.json({ message: "Friend request not found" }, { status: 404 });
        }

        const updateResult = await updateFriendRequestStatus(friendRequest.id, status);

        if (!updateResult.success) {
            return NextResponse.json({ message: "Error updating status", error: updateResult.error }, { status: 500 });
        }

        return NextResponse.json({ message: "Friend request status updated successfully" }, { status: 200 });

    } catch (error) {
        console.error("Error updating friend request:", error);
        return NextResponse.json({ message: "Server error", error }, { status: 500 });
    }
}
