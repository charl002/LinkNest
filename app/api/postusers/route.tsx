import { NextResponse } from "next/server";
import addData from "@/firebase/firestore/addData";

export async function POST(req: Request) {
    try {
        const { email, name } = await req.json();

        if (!email || !name) {
            return NextResponse.json({ message: "Email and name are required" }, { status: 400 });
        }

        const data = { email, name };
        const { result: docId, error } = await addData("users", data);

        if (error) {
            return NextResponse.json({ message: "Error adding user", error }, { status: 500 });
        }

        return NextResponse.json({ message: "user added successfully", id: docId }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ message: "Unexpected error occurred", error: err }, { status: 500 });
    }
}

