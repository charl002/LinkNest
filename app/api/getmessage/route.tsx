/**
 * @route GET /api/getmessage
 * @description Retrieves a single message by its ID from the Firestore "messages" collection.
 *
 * @query {string} messageId - The ID of the message to retrieve.
 *
 * @returns {200 OK} { id: string, ...messageData } - The retrieved message document.
 * @returns {400 Bad Request} If the `messageId` query parameter is missing.
 * @returns {404 Not Found} If the message with the specified ID does not exist.
 * @returns {500 Internal Server Error} If a server-side error occurs during retrieval.
 */
import { NextResponse } from "next/server";
import { getFirestore, doc, getDoc } from "@firebase/firestore";
import firebase_app from "@/firebase/config";

const db = getFirestore(firebase_app);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const messageId = searchParams.get("messageId");

        if (!messageId) {
            return NextResponse.json({ message: "Message ID is required." }, { status: 400 });
        }

        const messageRef = doc(db, "messages", messageId);
        const messageSnap = await getDoc(messageRef);

        if (!messageSnap.exists()) {
            return NextResponse.json({ message: "Message not found." }, { status: 404 });
        }

        return NextResponse.json({ id: messageId, ...messageSnap.data() }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Unexpected error occurred", error }, { status: 500 });
    }
}
