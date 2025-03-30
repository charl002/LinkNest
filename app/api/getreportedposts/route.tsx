import { NextResponse } from "next/server";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import firebase_app from "@/firebase/config";

interface Report {
    reportedBy: string;
    reason: string;
    timestamp: string;
}

interface ReportedPost {
    id: string;
    postType: string;
    title: string;
    description: string;
    username: string;
    reports: Report[];
    [key: string]: string | Report[] | number;
}

const db = getFirestore(firebase_app);


/**
 * @swagger
 * /api/getreportedposts:
 *   get:
 *     summary: Get all reported posts
 *     description: Retrieves all posts that have been reported from 'posts', 'news', and 'bluesky' collections.
 *     responses:
 *       200:
 *         description: A list of reported posts.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       postType:
 *                         type: string
 *                         description: Source collection of the post (e.g., posts, news, bluesky)
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       username:
 *                         type: string
 *                       reports:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             reportedBy:
 *                               type: string
 *                             reason:
 *                               type: string
 *                             timestamp:
 *                               type: string
 *                               format: date-time
 *       500:
 *         description: Server error while retrieving reported posts
 */
export async function GET() {
    try {
        const collections = ['posts', 'news', 'bluesky'];
        let allReportedPosts: ReportedPost[] = [];

        for (const collectionName of collections) {
            const collectionRef = collection(db, collectionName);
            const q = query(collectionRef, where("reports", "!=", null));
            const querySnapshot = await getDocs(q);

            const reportedPosts: ReportedPost[] = querySnapshot.docs
                .map(doc => ({
                    id: doc.id,
                    postType: collectionName,
                    ...doc.data(),
                } as ReportedPost))
                .filter((post): post is ReportedPost => 
                    Array.isArray(post.reports) && post.reports.length > 0
                );

            allReportedPosts = [...allReportedPosts, ...reportedPosts];
        }

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