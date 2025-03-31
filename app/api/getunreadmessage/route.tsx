import { NextResponse } from "next/server";
import { getFirestore, collection, query, where, getDocs } from "@firebase/firestore";
import firebase_app from "@/firebase/config";

const db = getFirestore(firebase_app);

/**
 * @swagger
 * /api/getunreadmessages:
 *   get:
 *     summary: Get unread message counts for a user
 *     description: Retrieves unread message count and last message from each sender for the specified receiver.
 *     tags:
 *      - Messages
 *     parameters:
 *       - in: query
 *         name: receiver
 *         schema:
 *           type: string
 *         required: true
 *         description: The username of the message receiver
 *     responses:
 *       200:
 *         description: A map of senders and their unread message count and last message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 unreadCounts:
 *                   type: object
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       count:
 *                         type: number
 *                       message:
 *                         type: string
 *       400:
 *         description: The receiver query parameter is required
 *       500:
 *         description: Server error while fetching unread messages
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const receiver = searchParams.get("receiver");

    if (!receiver) {
        return NextResponse.json({ message: "The receiver is required" }, { status: 400 });
    }

    try {
      const usersRef = collection(db, "unreadmessages");

      const querySnapshot = await getDocs(query(usersRef, where("receiver", "==", receiver)));

      if (querySnapshot.empty) {
        return NextResponse.json({ message: "No unread messages found"}, { status: 200 });
      }

      const unreadCounts: Record<string, { count: number; message: string }> = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        unreadCounts[data.sender] = {
          count: data.count,
          message: data.message, // Retrieve the message field
        };
      });

      return NextResponse.json({ unreadCounts }, { status: 200 });
    } catch (error) {
      return NextResponse.json({ message: "Error fetching unread messages for this receiver", error: error }, { status: 500 });
    }
}