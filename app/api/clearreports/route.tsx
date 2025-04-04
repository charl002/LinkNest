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