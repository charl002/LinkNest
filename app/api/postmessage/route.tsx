import { NextResponse } from "next/server";
import addData from "@/firebase/firestore/addData";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
    try {
      const session = await auth();

      if (!session || !session.user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }

      const { senderUsername, receiverUsername, message } = await req.json();

      if (!senderUsername || !receiverUsername || !message) {
          return NextResponse.json({ message: "Both usernames and message are required" }, { status: 400 });
      }

      const now =  new Date();

      const data = { sender: senderUsername, receiver: receiverUsername, message: message, seen: false, date: now.getTime() };

      const { result: docId, error } = await addData("messages", data);

      if (error) {
          return NextResponse.json({ message: "Error adding message", error }, { status: 500 });
      }

      return NextResponse.json({ message: "Message added sucessfully", id: docId }, { status: 200 });

    } catch (err) {
      return NextResponse.json({ message: "Unexpected error occurred", error: err }, { status: 500 });
    }
}
