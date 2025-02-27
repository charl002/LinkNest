import { NextResponse } from "next/server";
import { incrementLikes } from "@/firebase/firestore/updateLikes"; // Adjust the import path as necessary

export async function PUT(req: Request) {
    try {
        const { id, type, increment } = await req.json(); // Expecting { id: string, type: 'posts' | 'bluesky' | 'news', increment: boolean }

        // Validate input
        if (!id || !type) {
            return NextResponse.json({ message: 'Missing id or type' }, { status: 400 });
        }

        // Call the incrementLikes function
        const message = await incrementLikes(id, type, increment);

        return NextResponse.json({ message }, { status: 200 });
    } catch (error) {
        const err = error as Error; // Type assertion
        console.error('Error in PUT /api/updateLikes:', err);
        return NextResponse.json({ message: 'An error occurred', error: err.message }, { status: 500 });
    }
}