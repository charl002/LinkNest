import { NextResponse } from "next/server";
import updateArrayField from "@/firebase/firestore/updateData";

export async function POST(req: Request) {
    try {
        const { postId, username, comment, postType } = await req.json();

        if (!postId || !username || !comment || !postType) {
            return NextResponse.json({ message: "Email, name, username, and image are required" }, { status: 400 });
        }

        const now =  new Date();
        const datePart = now.toISOString().split("T")[0]; 
        const timePart = now.toLocaleString("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
        });
        const date = `${datePart} ${timePart}`

        const newComment = { 
            username,
            comment , 
            likes: 0 ,
            date,
            likedBy: [],
        };

        const { result: docId, error } = await updateArrayField(postType, postId, "comments", newComment);

        if (error) {
            return NextResponse.json({ message: "Error adding comment", error }, { status: 500 });
        }

        return NextResponse.json({ message: "comment added successfully", id: docId }, { status: 200 });

    } catch (err) {
        return NextResponse.json({ message: "Unexpected error occurred", error: err }, { status: 500 });
    }
}

