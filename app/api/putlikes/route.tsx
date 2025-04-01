import { NextResponse } from "next/server";
import { incrementLikes } from "@/firebase/firestore/updateLikes"; // Adjust the import path as necessary
import { withRetry } from '@/utils/backoff';
import cache from "@/lib/cache";

export async function PUT(req: Request) {
    try {
        const { id, type, increment, username } = await req.json(); // Expecting { id: string, type: 'posts' | 'bluesky' | 'news', increment: boolean, username: string }

        // Validate input
        if (!id || !type || !username) {
            return NextResponse.json({ message: 'Missing id, type, or username' }, { status: 400 });
        }

        // Call the incrementLikes function
        const message = await withRetry(
            () => incrementLikes(id, type, increment, username),
            {
                maxAttempts: 3,
                initialDelay: 500,
                maxDelay: 3000
            }
        );

        cache.del(`${type}-posts`);
        console.log(`[CACHE INVALIDATION] ${type}-posts cleared due to like update.`);

        return NextResponse.json({ message }, { status: 200 });
    } catch (error) {
        const err = error as Error; // Type assertion
        console.error('Error in PUT /api/updateLikes:', err);
        return NextResponse.json({ 
            message: 'An error occurred', 
            error: err.message,
            details: err.stack
        }, { status: 500 });
    }
}