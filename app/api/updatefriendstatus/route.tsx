import { NextResponse } from "next/server";
import { getFriendRequests } from "@/firebase/firestore/getData";
import { updateFriendRequestStatus } from "@/firebase/firestore/updateStatus";

export async function POST(req: Request) {
    try {
        const { senderUsername, receiverUsername, status } = await req.json();

        if (!senderUsername || !receiverUsername || !status) {
            return NextResponse.json({ message: "Missing parameters" }, { status: 400 });
        }

        const { requests, error } = await getFriendRequests();

        if (error) {
            return NextResponse.json({ message: "Error fetching friend requests", error }, { status: 500 });
        }

        if (!requests || requests.length === 0) {
            return NextResponse.json({ message: "No friend requests found" }, { status: 404 });
        }

        const friendRequest = requests.find(
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
