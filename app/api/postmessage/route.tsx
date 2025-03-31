import { NextResponse } from "next/server";
import addData from "@/firebase/firestore/addData";
import { auth } from "@/lib/auth";
import { withRetry } from '@/utils/backoff';

export async function POST(req: Request) {
    try {
      const session = await auth();

      if (!session || !session.user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }

      const { senderUsername, receiverUsername, message, isCallMsg, replyTo } = await req.json();

      if (!senderUsername || !receiverUsername || !message || isCallMsg === undefined) {
        return NextResponse.json({ message: "Both usernames and message is required!" }, { status: 400 });
      }

      const now = new Date();

      const data = { sender: senderUsername, receiver: receiverUsername, message: message, seen: false, date: now.getTime(), reactions: [], isCallMsg: isCallMsg, ...(replyTo !== undefined && { replyTo }) };

      const { result: docId, error } = await withRetry(
        () => addData("messages", data),
        {
          maxAttempts: 3,
          initialDelay: 500,
          maxDelay: 3000
        }
      );

      if (error) {
          console.error("Firestore error:", error);
          return NextResponse.json({ message: "Error adding message", error }, { status: 500 });
      }

      return NextResponse.json({ message: "Message added successfully", id: docId }, { status: 200 });

    } catch (err) {
      console.error("Server error:", err);
      return NextResponse.json({ 
        message: "Unexpected error occurred", 
        error: err instanceof Error ? err.message : "Unknown error" 
      }, { status: 500 });
    }
}
