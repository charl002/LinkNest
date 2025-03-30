import { NextResponse } from "next/server";
import { getFirestore, doc, getDoc, deleteDoc } from "firebase/firestore";
import firebase_app from "@/firebase/config";

const db = getFirestore(firebase_app);

/**
 * @swagger
 * /api/deletemessage:
 *   post:
 *     summary: Delete a chat message
 *     description: Deletes a message from the Firestore `messages` collection. Only the sender of the message can delete it.
 *     tags:
 *       - Messages
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messageId
 *               - username
 *             properties:
 *               messageId:
 *                 type: string
 *                 example: "abc123"
 *               username:
 *                 type: string
 *                 example: "john_doe"
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Message deleted successfully
 *       400:
 *         description: Missing required fields
 *       403:
 *         description: Unauthorized - Only the message sender can delete the message
 *       404:
 *         description: Message not found
 *       500:
 *         description: Internal server error
 */
export async function POST(request: Request) {
  try {
    const { messageId, username } = await request.json();
    if (!messageId || !username || typeof messageId !== "string") {
      return NextResponse.json(
        { message: "Missing required fields: messageId or username" },
        { status: 400 }
      );
    }

    const messageRef = doc(db, "messages", messageId);
    const messageSnap = await getDoc(messageRef);

    if (!messageSnap.exists()) {
      return NextResponse.json(
        { message: "Message not found" },
        { status: 404 }
      );
    }

    const messageData = messageSnap.data();

    if (messageData.sender !== username) {
      return NextResponse.json(
        { message: "Unauthorized: You can only delete your own messages" },
        { status: 403 }
      );
    }

    await deleteDoc(messageRef);

    return NextResponse.json(
      { message: "Message deleted successfully" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { message: "Internal server error", error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
