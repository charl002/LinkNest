import { NextResponse } from "next/server";
import addData from "@/firebase/firestore/addData";
import { auth } from "@/lib/auth";
// import { getDocument }  from "@/firebase/firestore/getData";
// import updateData from "@/firebase/firestore/updateData";

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { sender, receiver, count } = await req.json();

        if (!sender || !receiver || !count) {
            return NextResponse.json({ message: "Sender, receiver, and count are required" }, { status: 400 });
        }

        const docId = `${sender}_${receiver}`; // 🔹 Unique doc ID for sender-receiver pair
        // const existingData = await getDocument("unreadmessages", docId);

        // if (existingData.result) {
            // const updatedCount = count === 0 ? 0 : (existingData.result.data()?.count || 0) + 1;
            // const { error } = await updateData("unreadmessages", docId, { count: updatedCount });

            // if (error) {
            //     return NextResponse.json({ message: "Error updating unread messages count", error }, { status: 500 });
            // }

            // return NextResponse.json({ message: "Message count updated successfully", id: docId, count: updatedCount }, { status: 200 });

        // } else {
            // 🔥 **Fix: Ensure document creation before updating**
        const newData = { sender, receiver, count: count === 0 ? 0 : 1 }; // Ensure 1 on creation
        
        const { result: newDocId, error } = await addData("unreadmessages", newData, docId);

        if (error) {
            return NextResponse.json({ message: "Error creating unread message count", error }, { status: 500 });
        }

        return NextResponse.json({ message: "Message count created successfully", id: newDocId, count: newData.count }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ message: "Unexpected error occurred", error: err }, { status: 500 });
    }
}