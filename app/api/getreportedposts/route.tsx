import { NextResponse } from "next/server";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import firebase_app from "@/firebase/config";

const db = getFirestore(firebase_app);

export async function GET() {
    try {
        const postsRef = collection(db, "posts");
        const q = query(postsRef, where("reports", "!=", null));
        const querySnapshot = await getDocs(q);

        const reportedPosts = querySnapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data(),
            }))
            .filter(post => post.reports && post.reports.length > 0);

        return NextResponse.json({ posts: reportedPosts }, { status: 200 });
    } catch (error) {
        console.error("Error fetching reported posts:", error);
        return NextResponse.json(
            { message: "Failed to fetch reported posts" },
            { status: 500 }
        );
    }
}