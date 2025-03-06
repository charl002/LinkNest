import { NextResponse } from "next/server";
import addData from "@/firebase/firestore/addData";
import { auth } from "@/lib/auth";
import { getDocument } from "@/firebase/firestore/getData";
import updateData from "@/firebase/firestore/updateData";

export async function POST(req: Request) {
    try {
      const session = await auth();

      if (!session || !session.user) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }

      const { sender, receiver } = await req.json();

      if (!sender || !receiver) {
          return NextResponse.json({ message: "The sender and receiver are required" }, { status: 400 });
      }

      const docId = `${sender}_${receiver}`; // Unique doc ID for sender-receiver pair
      const existingData = await getDocument("unreadmessages", docId);

      if (existingData.result) {
        // 🔹 Increment count if the document exists
        const updatedCount = existingData.result.data()?.count + 1;

        const { error } = await updateData("unreadmessages", docId, { count: updatedCount });

        if (error) {
            return NextResponse.json({ message: "Error updating unread messages count", error }, { status: 500 });
        }

        return NextResponse.json({ message: "Message count updated successfully", id: docId, count: updatedCount }, { status: 200 });
        
      } else {
        // 🔹 Create a new document if it doesn't exist
        const data = { sender, receiver, count: 1 };
        const { result: newDocId, error } = await addData("unreadmessages", data, docId);

        if (error) {
            return NextResponse.json({ message: "Error adding unread messages count", error }, { status: 500 });
        }

        return NextResponse.json({ message: "Message count created successfully", id: newDocId, count: 1 }, { status: 200 });
      }


    } catch (err) {
      return NextResponse.json({ message: "Unexpected error occurred", error: err }, { status: 500 });
    }
}
