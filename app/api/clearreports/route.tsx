/**
 * @route POST /api/clearreports
 * @description Clears all reports on a specific post. Requires admin authentication.
 *
 * @requestBody
 * {
 *   postId: string,    // The ID of the post to clear reports from
 *   postType: string   // The Firestore collection name (e.g., "posts", "bluesky")
 * }
 *
 * @returns {200 OK} { message: "Reports cleared successfully" }
 * @returns {400 Bad Request} { message: "Post ID and type are required" }
 * @returns {403 Forbidden}  If the user is not authenticated as an admin
 * @returns {500 Internal Server Error} { message: "Internal server error" }
 */
import { NextResponse } from "next/server";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import firebase_app from "@/firebase/config";
import { authenticateAdmin } from "@/lib/authMiddleware";

const db = getFirestore(firebase_app);

export async function POST(request: Request) {
    const authError = await authenticateAdmin();
    if (authError) return authError;
    try {
        const { postId, postType } = await request.json();

        if (!postId || !postType) {
            return NextResponse.json(
                { message: "Post ID and type are required" },
                { status: 400 }
            );
        }

        const postRef = doc(db, postType, postId);
        await updateDoc(postRef, {
            reports: []
        });

        return NextResponse.json(
            { message: "Reports cleared successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
}