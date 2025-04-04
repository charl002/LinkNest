/**
 * @route POST /api/postaddfriend
 * @description Creates a new friendship between two users if one doesn't already exist.
 *              Checks Firestore for existing friendships to prevent duplicates.
 *
 * @body {string} senderUsername - The username of the user initiating the friend request.
 * @body {string} receiverUsername - The username of the user receiving the friend request.
 *
 * @returns {200 OK} If the friend was successfully added.
 * @returns {400 Bad Request} If one or both usernames are missing.
 * @returns {409 Conflict} If the friendship already exists.
 * @returns {500 Internal Server Error} If there's an issue retrieving or storing the data.
 */
import { NextResponse } from "next/server";
import { getAllDocuments } from "@/firebase/firestore/getData";
import addData from "@/firebase/firestore/addData";

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
