import { NextResponse } from "next/server";
import { getFirestore, collection, query, where, getDocs } from "@firebase/firestore";
import firebase_app from "@/firebase/config";
import { Comment } from "@/types/comment";

const db = getFirestore(firebase_app);

/**
 * @swagger
 * /api/getpostsbyusername:
 *   get:
 *     summary: Get all posts by username
 *     description: Returns all posts created by the specified username.
 *     tags:
 *      - Posts
 *     parameters:
 *       - in: query
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: The username to filter posts by.
 *     responses:
 *       200:
 *         description: A list of posts by the user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 posts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       username:
 *                         type: string
 *                       description:
 *                         type: string
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                       likedBy:
 *                         type: array
 *                         items:
 *                           type: string
 *                       comments:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             comment:
 *                               type: string
 *                             username:
 *                               type: string
 *                             date:
 *                               type: string
 *                             likes:
 *                               type: number
 *                             likedBy:
 *                               type: array
 *                               items:
 *                                 type: string
 *                       likes:
 *                         type: number
 *                       images:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             url:
 *                               type: string
 *                             alt:
 *                               type: string
 *                             thumb:
 *                               type: string
 *                       postType:
 *                         type: string
 *       400:
 *         description: Username parameter is required
 *       500:
 *         description: Error fetching posts
 */
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
        return NextResponse.json({ message: "Username parameter is required" }, { status: 400 });
    }

    try {
        const postsRef = collection(db, "posts");
        const q = query(postsRef, where("username", "==", username));
        const querySnapshot = await getDocs(q);

        const posts = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                username: data.username,
                description: data.text,
                tags: data.tags || [],
                likedBy: data.likedBy || [],
                comments: data.comments.map((comment: Comment) => ({
                    comment: comment.comment,
                    username: comment.username,
                    date: comment.date,
                    likes: comment.likes || 0,
                    likedBy: comment.likedBy || []
                })) || [],
                likes: data.likes || 0,
                images: [{ url: data.fileUrl, alt: data.title, thumb: data.fileUrl }],
                postType: 'posts'
            };
        });

        return NextResponse.json({ success: true, posts }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error fetching posts", error }, { status: 500 });
    }
}
