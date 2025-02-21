import { NextResponse } from "next/server";
import addData from "@/firebase/firestore/addData";

export async function POST(req: Request) {
    try {
        const { senderUsername, receiverUsername } = await req.json();

        if (!senderUsername || !receiverUsername) {
            return NextResponse.json({ message: "Both usernames are required" }, { status: 400 });
        }

        const data = { senderUsername, receiverUsername, status: "pending" };

        const { result: docId, error } = await addData("friend_requests", data);

        if (error) {
            return NextResponse.json({ message: "Error adding friend request", error }, { status: 500 });
        }

        return NextResponse.json({ message: "Friend request sent", id: docId }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ message: "Unexpected error occurred", error: err }, { status: 500 });
    }
}
