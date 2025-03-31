import { NextResponse } from "next/server";
import { getAllDocuments } from "@/firebase/firestore/getData";
import addData from "@/firebase/firestore/addData";

/**
 * @swagger
 * /api/postaddfriend:
 *   post:
 *     summary: Add a new friend connection
 *     description: Adds a friendship between two users if they are not already friends.
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
 *                 example: johndoe
 *               receiverUsername:
 *                 type: string
 *                 example: janedoe
 *     responses:
 *       200:
 *         description: Friend added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 id:
 *                   type: string
 *       400:
 *         description: Missing required usernames
 *       409:
 *         description: Users are already friends
 *       500:
 *         description: Server or Firestore error
 */
export async function POST(req: Request) {
    try {
        const { senderUsername, receiverUsername } = await req.json();

        if (!senderUsername || !receiverUsername) {
            return NextResponse.json({ message: "Both usernames are required" }, { status: 400 });
        }

        const { results, error } = await getAllDocuments("friends");

        if (error || !results) {
            return NextResponse.json({ message: "Error fetching friends", error }, { status: 500 });
        }

        const friends = results.docs.map(doc => doc.data());
        const existingFriendship = friends.find(friend => 
            (friend.user1 === senderUsername && friend.user2 === receiverUsername) ||
            (friend.user1 === receiverUsername && friend.user2 === senderUsername)
        );

        if (existingFriendship) {
            return NextResponse.json({ message: "You are already friends!" }, { status: 409 });
        }

        const newFriendship = { user1: senderUsername, user2: receiverUsername };
        const { result: docId, error: addError } = await addData("friends", newFriendship);

        if (addError) {
            return NextResponse.json({ message: "Error adding friend", error: addError }, { status: 500 });
        }

        return NextResponse.json({ message: "Friend added successfully", id: docId }, { status: 200 });

    } catch (error) {
        console.error("Error adding friend:", error);
        return NextResponse.json({ message: "Unexpected error occurred", error }, { status: 500 });
    }
}
