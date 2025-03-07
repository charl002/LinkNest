import { NextResponse } from "next/server";
import { incrementCommentLikes } from "@/firebase/firestore/updateCommentLikes";

export async function PUT(req: Request) {
    try {
        const { id, type, increment, username, commentIndex } = await req.json();

        // Validate input
        if (!id || commentIndex === undefined || !username) {
            return NextResponse.json({ message: 'Missing id, commentIndex, or username' }, { status: 400 });
        }

        // Call the incrementCommentLikes function
        const message = await incrementCommentLikes(id, type, increment, username, commentIndex);

        return NextResponse.json({ message }, { status: 200 });
    } catch (error) {
        const err = error as Error;
        console.error('Error in PUT /api/putcommentlikes:', err);
        return NextResponse.json({ message: 'An error occurred', error: err.message }, { status: 500 });
    }
}