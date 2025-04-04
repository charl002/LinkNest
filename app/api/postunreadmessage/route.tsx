/**
 * @route POST /api/postunreadmessage
 * @description Creates or updates the unread message count and latest message for private or group chats.
 *
 * @auth Required - Only authenticated users can access this endpoint.
 *
 * @requestBody {
 *   sender: string;         // Username of the message sender
 *   receiver: string;       // Username of the message receiver
 *   count: number;          // Unread message count to update
 *   message: string;        // Latest message content
 *   groupId?: string;       // (Optional) Group ID for group chats
 * }
 *
 * @returns {200 OK} If the unread message count was updated or created successfully.
 * @returns {400 Bad Request} If any required field is missing.
 * @returns {401 Unauthorized} If the user is not authenticated.
 * @returns {500 Internal Server Error} On server or Firestore/Azure failure.
 */
import { NextResponse } from "next/server";
import addData from "@/firebase/firestore/addData";
import { auth } from "@/lib/auth";
import { getDocument } from "@/firebase/firestore/getData";
import updateData from "@/firebase/firestore/updateUnreadCount";
import { withRetry } from "@/utils/backoff";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { sender, receiver, count, message, groupId } = await req.json();

    if (!sender || !receiver || count === undefined || message === undefined) {
      return NextResponse.json(
        { message: "Sender, receiver, count, and message are required" },
        { status: 400 }
      );
    }

    const docId = groupId
      ? `${sender}_${receiver}_${groupId}` // For group messages
      : `${sender}_${receiver}`; // For private messages

    const existingData = await withRetry(
      () => getDocument("unreadmessages", docId),
      {
        maxAttempts: 3,
        initialDelay: 500,
        maxDelay: 3000,
      }
    );

    if (existingData?.result?.exists()) {
      // If the count is 0, set the count to 0, otherwise increment the count by 1
      const updatedCount =
        count === 0 ? 0 : (existingData.result.data()?.count || 0) + 1;

      const { error } = await withRetry(
        () =>
          updateData("unreadmessages", docId, { count: updatedCount, message, groupId: groupId }), // Save latest message
        {
          maxAttempts: 3,
          initialDelay: 500,
          maxDelay: 3000,
        }
      );

      if (error) {
        return NextResponse.json(
          { message: "Error updating unread messages count", error },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          message: "Message count updated successfully",
          id: docId,
          count: updatedCount,
          latestMessage: message,
        },
        { status: 200 }
      );
    } else {
      // Create a new document for unread messages with the latest message
      const newData = { sender, receiver, count: count === 0 ? 0 : 1, message, groupId }; // Include message in new data

      const { result, error } = await addData("unreadmessages", newData, docId);

      if (error) {
        return NextResponse.json(
          { message: `Error! ${result}`, error },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          message: "Message count created successfully",
          id: docId,
          count: newData.count,
          latestMessage: newData.message,
        },
        { status: 200 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { message: "Unexpected error occurred", error: err },
      { status: 500 }
    );
  }
}
