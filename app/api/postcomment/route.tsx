import { NextResponse } from "next/server";
import updateArrayField from "@/firebase/firestore/updateData";
import { withRetry } from '@/utils/backoff';
import cache from "@/lib/cache";

export async function POST(req: Request) {
    try {
        const { postId, username, comment, postType } = await req.json();

        if (!postId || !username || !comment || !postType) {
            return NextResponse.json({ message: "Email, name, username, and image are required" }, { status: 400 });
        }

        const now = new Date();
        const datePart = now.toISOString().split("T")[0]; 
        const timePart = now.toLocaleString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
        });
        const date = `${datePart} ${timePart}`

        const newComment = { 
            username,
            comment,
            likes: 0,
            date,
            likedBy: [],
        };

        const { result: docId, error } = await withRetry(
            () => updateArrayField(postType, postId, "comments", newComment),
            {
                maxAttempts: 3,
                initialDelay: 500,
                maxDelay: 3000
            }
        );

        if (error) {
            return NextResponse.json({ message: "Error adding comment", error }, { status: 500 });
        }

        cache.del(`${postType}-posts`);
        console.log(`[CACHE INVALIDATION] ${postType}-posts cleared due to new comment.`);

        return NextResponse.json({ message: "comment added successfully", id: docId }, { status: 200 });

    } catch (err) {
        return NextResponse.json({ message: "Unexpected error occurred", error: err }, { status: 500 });
    }
}

