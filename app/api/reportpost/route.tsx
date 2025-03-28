import { NextResponse } from "next/server";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import firebase_app from "@/firebase/config";

const db = getFirestore(firebase_app);

export async function POST(request: Request) {
    try {
        const { postId, reportedBy, reason, postType } = await request.json();

        if (!postId || !reportedBy || !reason || !postType) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        // Determine collection based on postType
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
        const reports = currentData.reports || [];

        // Check if user already reported this post
        if (reports.some((report: any) => report.reportedBy === reportedBy)) {
            return NextResponse.json(
                { message: "You have already reported this post" },
                { status: 400 }
            );
        }

        // Add the report
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