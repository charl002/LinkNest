/**
 * @route POST /api/reportpost
 * @description Reports a post for inappropriate content or other reasons. Each user can report a post only once.
 *
 * @requestBody JSON {
 *   postId: string;        // ID of the post to report (required)
 *   reportedBy: string;    // Username of the reporting user (required)
 *   reason: string;        // Reason for the report (required)
 *   postType: string;      // Type of the post (e.g., "posts", "news", "bluesky") (required)
 * }
 *
 * @returns {200 OK} If the report was added successfully.
 * @returns {400 Bad Request} If required fields are missing or user already reported.
 * @returns {401 Unauthorized} If the user is not authenticated.
 * @returns {403 Forbidden} If the user is not authorized.
 * @returns {404 Not Found} If the post does not exist.
 * @returns {500 Internal Server Error} On unexpected failure.
 */
import { NextResponse } from "next/server";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import firebase_app from "@/firebase/config";
import { authenticateRequest, authorizeUser } from "@/lib/authMiddleware";

interface Report {
    reportedBy: string;
    reason: string;
    timestamp: string;
}

const db = getFirestore(firebase_app);

export async function POST(request: Request) {
    try {
        // Check authentication
        const authError = await authenticateRequest();
        if (authError) return authError;

        const { postId, reportedBy, reason, postType } = await request.json();

        // Authorize the user
        const authzError = await authorizeUser(reportedBy);
        if (authzError) return authzError;

        if (!postId || !reportedBy || !reason || !postType) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        const collection = postType.toLowerCase();
        const postRef = doc(db, collection, postId);
        const postDoc = await getDoc(postRef);

        if (!postDoc.exists()) {
            return NextResponse.json(
                { message: "Post not found" },
                { status: 404 }
            );
        }

        const currentData = postDoc.data();
        const reports: Report[] = currentData.reports || [];

        if (reports.some((report: Report) => report.reportedBy === reportedBy)) {
            return NextResponse.json(
                { message: "You have already reported this post" },
                { status: 400 }
            );
        }

        await updateDoc(postRef, {
            reports: [...reports, {
                reportedBy,
                reason,
                timestamp: new Date().toISOString()
            }]
        });

        return NextResponse.json(
            { message: "Post reported successfully" },
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