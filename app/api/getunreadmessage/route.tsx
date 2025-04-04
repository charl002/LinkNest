/**
 * @route GET /api/getunreadmessage
 * @description Retrieves unread message counts for a specified receiver.
 *              Can fetch either private unread messages or group unread messages based on provided query params.
 *
 * @query {string} receiver - The username of the message receiver (required).
 * @query {string} [groupId] - Optional group ID to fetch group-specific unread messages.
 *
 * @returns {200 OK} Object mapping each sender to their unread message count, latest message, and groupId.
 * @returns {400 Bad Request} If the receiver parameter is missing.
 * @returns {500 Internal Server Error} If an error occurs while fetching data from Firestore.
 */
import { NextResponse } from "next/server";
import { getFirestore, collection, query, where, getDocs } from "@firebase/firestore";
import firebase_app from "@/firebase/config";

const db = getFirestore(firebase_app);

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const receiver = searchParams.get("receiver");
    const groupId = searchParams.get("groupId");

    if (!receiver) {
        return NextResponse.json({ message: "The receiver is required" }, { status: 400 });
    }

    try {
      const usersRef = collection(db, "unreadmessages");

      let querySnapshot;

      if (groupId) {
        querySnapshot = await getDocs(query(usersRef, where("groupId", "==", groupId)));
      } else if (receiver) {
        // If groupId is not provided, fetch private messages for the receiver
        querySnapshot = await getDocs(query(usersRef, where("receiver", "==", receiver), where("groupId", "==", null)));
      }

      if (querySnapshot === undefined) {
        return NextResponse.json({ message: "No unread messages found" }, { status: 200 });
      }

      const unreadCounts: Record<string, { count: number; message: string, groupId: string }> = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        unreadCounts[data.sender] = {
          count: data.count,
          message: data.message, // Retrieve the message field
          groupId: data.groupId
        };
      });

      return NextResponse.json({ unreadCounts }, { status: 200 });
    } catch (error) {
      return NextResponse.json({ message: "Error fetching unread messages for this receiver", error: error }, { status: 500 });
    }
}