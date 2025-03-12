import { NextResponse } from "next/server";
import { getAllDocuments } from "@/firebase/firestore/getData";
import { withRetry } from '@/utils/backoff';

export async function GET() {
    try {
        const { results, error } = await withRetry(
            () => getAllDocuments("comments"),
            {
                maxAttempts: 3,
                initialDelay: 500,
                maxDelay: 3000
            }
        );
        if (error || !results) {
            return NextResponse.json({ message: "Error fetching comments", error }, { status: 500 });
        }

        if (results.empty) {
            return NextResponse.json({ message: "No Comments found" }, { status: 404 });
        }

        const comments = results.docs.map(comment => ({
            id: comment.id,
            ...comment.data(),
        }));

        return NextResponse.json({ comments }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ message: "Unexpected error occurred", error: err }, { status: 500 });
    }
}
