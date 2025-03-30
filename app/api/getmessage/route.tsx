import { NextResponse } from "next/server";
import { getFirestore, doc, getDoc } from "@firebase/firestore";
import firebase_app from "@/firebase/config";

const db = getFirestore(firebase_app);

/**
 * @swagger
 * /api/getmessage:
 *   get:
 *     summary: Get a specific message by ID
 *     description: Retrieves a message document from the Firestore "messages" collection using the provided messageId query parameter.
 *     parameters:
 *       - in: query
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the message to retrieve
 *     responses:
 *       200:
 *         description: Message successfully retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 message:
 *                   type: string
 *                   description: The message content (example field)
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   description: Time the message was sent (example field)
 *       400:
 *         description: Message ID not provided
 *       404:
 *         description: Message not found
 *       500:
 *         description: Internal server error
 */
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
