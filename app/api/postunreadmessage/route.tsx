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

    const { sender, receiver, count, message } = await req.json();

    if (!sender || !receiver || count === undefined || !message) {
      return NextResponse.json(
        { message: "Sender, receiver, count, and message are required" },
        { status: 400 }
      );
    }

    const docId = `${sender}_${receiver}`; // 🔹 Unique doc ID for sender-receiver pair
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
          updateData("unreadmessages", docId, { count: updatedCount, message }), // Save latest message
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
      const newData = { sender, receiver, count: count === 0 ? 0 : 1, message }; // Include message in new data

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
