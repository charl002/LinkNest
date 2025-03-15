import { NextResponse } from "next/server";
import { getAllDocuments } from "@/firebase/firestore/getData";
import { withRetry } from '@/utils/backoff';

export async function GET() {
    try {
        const { results, error } = await withRetry(
            () => getAllDocuments("users"),
            {
                maxAttempts: 3,
                initialDelay: 500,
                maxDelay: 3000
            }
        );
        if (error || !results) {
            return NextResponse.json({ message: "Error fetching users", error }, { status: 500 });
        }

        if (results.empty) {
            return NextResponse.json({ message: "No users found" }, { status: 404 });
        }

        const users = results.docs.map(user => ({
            id: user.id,
            ...user.data(),
        }));

        return NextResponse.json({ users }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ message: "Unexpected error occurred", error: err }, { status: 500 });
    }
}
