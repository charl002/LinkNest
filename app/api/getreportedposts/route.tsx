import { NextResponse } from "next/server";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import firebase_app from "@/firebase/config";

const db = getFirestore(firebase_app);

export async function GET() {
    try {
        // Define collections to check
        const collections = ['posts', 'news', 'bluesky'];
        let allReportedPosts = [];

        // Fetch reported posts from each collection
        for (const collectionName of collections) {
            const collectionRef = collection(db, collectionName);
            const q = query(collectionRef, where("reports", "!=", null));
            const querySnapshot = await getDocs(q);

            const reportedPosts = querySnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    postType: collectionName, // Add collection name as postType
                    ...doc.data(),
                }))
                .filter(post => post.reports && post.reports.length > 0);

            allReportedPosts = [...allReportedPosts, ...reportedPosts];
        }

        // Sort all posts by most recent reports
        allReportedPosts.sort((a, b) => {
            const aLatest = Math.max(...a.reports.map(r => new Date(r.timestamp).getTime()));
            const bLatest = Math.max(...b.reports.map(r => new Date(r.timestamp).getTime()));
            return bLatest - aLatest;
        });

        return NextResponse.json({ posts: allReportedPosts }, { status: 200 });
    } catch (error) {
        console.error("Error fetching reported posts:", error);
        return NextResponse.json(
            { message: "Failed to fetch reported posts" },
            { status: 500 }
        );
    }
}