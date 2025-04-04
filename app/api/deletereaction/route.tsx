/**
 * @route PUT /api/deletereaction
 * @description Removes a user's reaction from a specific message in the Firestore "messages" collection.
 *
 * @requestBody
 * {
 *   messageId: string;  // The ID of the message from which to remove the reaction
 *   user: string;       // The username of the user whose reaction should be removed
 * }
 *
 * @behavior
 * - Validates that `messageId` and `user` are provided.
 * - Fetches the message document from Firestore.
 * - Filters out the reaction matching the given user.
 * - Updates the message document with the filtered reactions array.
 *
 * @returns {200 OK} { message: "Reaction removed successfully", id: string }
 * @returns {400 Bad Request} If messageId or user is missing.
 * @returns {404 Not Found} If the message does not exist.
 * @returns {500 Internal Server Error} On unexpected error.
 */
import { NextResponse } from "next/server";
import { getFirestore, doc, getDoc, updateDoc } from "@firebase/firestore";
import firebase_app from "@/firebase/config";

const db = getFirestore(firebase_app);

export async function PUT(req: Request) {
    try {
        const { messageId, user } = await req.json();

        if (!messageId || !user) {
            return NextResponse.json({ message: "MessageId and user are required." }, { status: 400 });
        }

        const messageRef = doc(db, "messages", messageId);
        const messageSnap = await getDoc(messageRef);

        if (!messageSnap.exists()) {
            return NextResponse.json({ message: "Message not found." }, { status: 404 });
        }

        let reactions = messageSnap.data().reactions || [];

        reactions = reactions.filter((reaction: { user: string }) => reaction.user !== user);

        await updateDoc(messageRef, { reactions });

        return NextResponse.json({ message: "Reaction removed successfully", id: messageId }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Unexpected error occurred", error }, { status: 500 });
    }
}
