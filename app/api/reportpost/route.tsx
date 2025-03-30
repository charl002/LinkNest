import { NextResponse } from "next/server";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import firebase_app from "@/firebase/config";

interface Report {
    reportedBy: string;
    reason: string;
    timestamp: string;
}

const db = getFirestore(firebase_app);

/**
 * @swagger
 * /api/reportpost:
 *   post:
 *     summary: Report a post
 *     description: Allows a user to report a post with a reason. Prevents duplicate reports from the same user.
 *     tags:
 *       - Posts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - postId
 *               - reportedBy
 *               - reason
 *               - postType
 *             properties:
 *               postId:
 *                 type: string
 *                 example: "post123"
 *               reportedBy:
 *                 type: string
 *                 example: "janedoe"
 *               reason:
 *                 type: string
 *                 example: "Inappropriate content"
 *               postType:
 *                 type: string
 *                 enum: [posts, bluesky, news]
 *                 example: "posts"
 *     responses:
 *       200:
 *         description: Post reported successfully
 *       400:
 *         description: Missing fields or duplicate report
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal server error
 */
export async function POST(request: Request) {
    try {
        const { postId, reportedBy, reason, postType } = await request.json();

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