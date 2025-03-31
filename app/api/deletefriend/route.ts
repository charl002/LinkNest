import { NextResponse } from "next/server";
import { getAllDocuments } from "@/firebase/firestore/getData";
import deleteData from "@/firebase/firestore/deleteData";

/**
 * @swagger
 * /api/deletefriend:
 *   delete:
 *     summary: Delete a friendship and associated friend request
 *     description: Removes both a friend request (if it exists) and the friendship between two users.
 *     tags:
 *       - Friends
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - senderUsername
 *               - receiverUsername
 *             properties:
 *               senderUsername:
 *                 type: string
 *                 example: user1
 *               receiverUsername:
 *                 type: string
 *                 example: user2
 *     responses:
 *       200:
 *         description: Friendship and friend request deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Friendship and friend request deleted successfully
 *       400:
 *         description: Missing senderUsername or receiverUsername
 *       404:
 *         description: Friendship not found
 *       500:
 *         description: Server or Firestore error
 */
export async function DELETE(req: Request) {
    try {
        const { senderUsername, receiverUsername } = await req.json();

        if (!senderUsername || !receiverUsername) {
            return NextResponse.json({ message: "Both usernames are required" }, { status: 400 });
        }

        const friendRequestsResult = await getAllDocuments("friend_requests");

        if (friendRequestsResult.error) {
            return NextResponse.json({ message: "Error fetching friend requests", error: friendRequestsResult.error }, { status: 500 });
        }

        const friendRequests = friendRequestsResult.results;

        if (friendRequests && friendRequests.docs.length > 0) {
            const requestDoc = friendRequests.docs.find(doc => {
                const data = doc.data();
                return (data.senderUsername === senderUsername && data.receiverUsername === receiverUsername || data.senderUsername == receiverUsername && data.receiverUsername == senderUsername);
            });

            if (requestDoc) {
                await deleteData("friend_requests", requestDoc.id);
            }
        }

        const friendsDataResult = await getAllDocuments("friends");

        if (friendsDataResult.error) {
            return NextResponse.json({ message: "Error fetching friends list", error: friendsDataResult.error }, { status: 500 });
        }

        const friendsData = friendsDataResult.results;

        if (!friendsData || friendsData.docs.length === 0) {
            return NextResponse.json({ message: "Friendship not found" }, { status: 404 });
        }

        const friendshipDoc = friendsData.docs.find(doc => {
            const data = doc.data();
            return (
                (data.user1 === senderUsername && data.user2 === receiverUsername) ||
                (data.user1 === receiverUsername && data.user2 === senderUsername)
            );
        });

        if (!friendshipDoc) {
            return NextResponse.json({ message: "Friendship not found" }, { status: 404 });
        }

        const { error: deleteFriendshipError } = await deleteData("friends", friendshipDoc.id);

        if (deleteFriendshipError) {
            return NextResponse.json({ message: "Error deleting friendship", error: deleteFriendshipError }, { status: 500 });
        }

        return NextResponse.json({ message: "Friendship and friend request deleted successfully" }, { status: 200 });

    } catch (err) {
        return NextResponse.json({ message: "Unexpected error occurred", error: err }, { status: 500 });
    }
}
