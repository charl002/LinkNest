import { NextResponse } from "next/server";
import { getAllDocuments } from "@/firebase/firestore/getData";
import  deleteData  from "@/firebase/firestore/deleteData"
import { withRetry } from '@/utils/backoff';
 
/**
 * @swagger
 * /api/deletefriendrequest:
 *   delete:
 *     summary: Delete a specific friend request
 *     description: Deletes a pending friend request based on sender and receiver usernames.
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
 *                 example: john_doe
 *               receiverUsername:
 *                 type: string
 *                 example: jane_smith
 *     responses:
 *       200:
 *         description: Friend request deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Friend request deleted successfully
 *       400:
 *         description: Missing senderUsername or receiverUsername
 *       404:
 *         description: Friend request not found
 *       500:
 *         description: Server or Firestore error
 */
export async function DELETE(req: Request) {
    try {
        const { senderUsername, receiverUsername } = await req.json();

        if (!senderUsername || !receiverUsername) {
            return NextResponse.json({ message: "Both usernames are required" }, { status: 400 });
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

        const requestDoc = results.docs.find(doc => {
            const data = doc.data();
            return data.senderUsername === senderUsername && data.receiverUsername === receiverUsername;
        });

        if (!requestDoc) {
            return NextResponse.json({ message: "Friend request not found" }, { status: 404 });
        }

        const { error: deleteError } = await withRetry(
            () => deleteData("friend_requests", requestDoc.id),
            {
                maxAttempts: 3,
                initialDelay: 500,
                maxDelay: 3000
            }
        );

        if (deleteError) {
            return NextResponse.json({ message: "Error deleting friend request", error: deleteError }, { status: 500 });
        }

        return NextResponse.json({ message: "Friend request deleted successfully" }, { status: 200 });

    } catch (err) {
        return NextResponse.json({ message: "Unexpected error occurred", error: err }, { status: 500 });
    }
}
