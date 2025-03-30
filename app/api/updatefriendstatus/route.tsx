import { NextResponse } from "next/server";
import { getFriendRequests } from "@/firebase/firestore/getData";
import { updateFriendRequestStatus } from "@/firebase/firestore/updateStatus";

/**
 * @swagger
 * /api/updatefriendstatus:
 *   post:
 *     summary: Update friend request status
 *     description: Accept or reject a friend request between two users.
 *     tags:
 *       - Friend Requests
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - senderUsername
 *               - receiverUsername
 *               - status
 *             properties:
 *               senderUsername:
 *                 type: string
 *                 example: "john_doe"
 *               receiverUsername:
 *                 type: string
 *                 example: "jane_doe"
 *               status:
 *                 type: string
 *                 enum: [accepted, rejected]
 *                 example: "accepted"
 *     responses:
 *       200:
 *         description: Friend request status updated successfully
 *       400:
 *         description: Missing parameters
 *       404:
 *         description: Friend request not found
 *       500:
 *         description: Internal server error
 */
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
