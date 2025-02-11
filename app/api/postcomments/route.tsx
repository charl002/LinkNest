import { NextResponse } from "next/server";
import addData from "@/firebase/firestore/addData";

export async function POST(req: Request) {
    try {
        const { username, comment } = await req.json();

        if (!username || !comment) {
            return NextResponse.json({ message: "Username and comment are required" }, { status: 400 });
        }

        const data = { username, comment };
        const { result: docId, error } = await addData("comments", data);

        if (error) {
            return NextResponse.json({ message: "Error adding comment", error }, { status: 500 });
        }

        return NextResponse.json({ message: "Comment added successfully", id: docId }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ message: "Unexpected error occurred", error: err }, { status: 500 });
    }
}

