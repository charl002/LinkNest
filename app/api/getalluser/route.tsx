/**
 * @route GET /api/getalluser
 * @description Retrieves all user documents from the Firestore "users" collection.
 *
 * @behavior
 * - Uses an exponential backoff strategy to retry the Firestore query on failure.
 * - Returns an array of all users, including their document ID and data.
 *
 * @returns {200 OK} { users: Array<Object> } - List of user data with Firestore IDs.
 * @returns {404 Not Found} If no users are found in the collection.
 * @returns {500 Internal Server Error} If Firestore query fails or another error occurs.
 */
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
