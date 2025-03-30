import { NextResponse } from "next/server";
import addData from "@/firebase/firestore/addData";
import { auth } from "@/lib/auth";
import { withRetry } from "@/utils/backoff";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const {
      senderUsername,
      receiverUsername,
      message,
      isCallMsg,
      groupId,
      receiversUsernames,
    } = await req.json();

    // Validate inputs
    if (!senderUsername || !message || isCallMsg === undefined) {
      return NextResponse.json(
        { message: "The sender, message, and isCallMsg are required!" },
        { status: 400 }
      );
    }

    if (
      receiverUsername === null &&
      (groupId === null ||
        !receiversUsernames ||
        receiversUsernames.length === 0)
    ) {
      return NextResponse.json(
        { message: "Receiver or group details are required!" },
        { status: 400 }
      );
    }

    const now = new Date();

    // Prepare the message data
    const data = {
      sender: senderUsername,
      message: message,
      seen: false,
      date: now.getTime(),
      reactions: [],
      isCallMsg: isCallMsg,
      groupId: groupId || null, // Group ID can be null for private messages
      receiver: receiverUsername || null, // Receiver will be null for group messages
      receiversUsernames: receiversUsernames || [], // Receivers for group messages
    };

    const { result: docId, error } = await withRetry(
      () => addData("messages", data),
      {
        maxAttempts: 3,
        initialDelay: 500,
        maxDelay: 3000,
      }
    );

    if (error) {
      console.error("Firestore error:", error);
      return NextResponse.json(
        { message: "Error adding message", error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Message added successfully", id: docId },
      { status: 200 }
    );
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json(
      {
        message: "Unexpected error occurred",
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
