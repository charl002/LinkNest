import { NextResponse } from "next/server";
import { getAllDocuments } from "@/firebase/firestore/getData";
import { Comment } from "@/types/comment";
import { withRetry } from '@/utils/backoff';
import cache from '@/lib/cache';
import { collection, query, orderBy, limit, startAfter, getDocs } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import firebase_app from "@/firebase/config";

interface Post {
    title: string;
    username: string;
    tags: [string];
    text: string;
    createdAt: string;
    author: {
      handle: string;
      displayName: string;
      avatar: string;
    };
    images: {
      url: string;
      alt: string;
      thumb: string;
    }[];
    fileUrl: string;
    likes: number;
    likedBy: string[];
    comments: Comment[];
}

const db = getFirestore(firebase_app)

export async function GET(request: Request){
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '0');
    const pageSize = parseInt(searchParams.get('limit') || '30');
    const lastDoc = searchParams.get('lastDoc');

    const cachedPosts = cache.get(`user-posts-${page}-${pageSize}`);
    if (cachedPosts) {
        console.log(`[SERVER CACHE] Returning cached user posts for page ${page}`);
        return new Response(JSON.stringify(cachedPosts), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=30, stale-while-revalidate=30'
            },
        });
    }

    try {
        const baseQuery = query(
            collection(db, "posts"),
            orderBy("createdAt", "desc"),
            limit(pageSize)
        );

        const finalQuery = lastDoc 
            ? query(baseQuery, startAfter(JSON.parse(lastDoc)))
            : baseQuery;

        const postsSnapshot = await withRetry(
            async () => {
                const snapshot = await getDocs(finalQuery);
                if (!snapshot) throw new Error('No snapshot returned');
                return snapshot;
            },
            {
                maxAttempts: 3,
                initialDelay: 500,
                maxDelay: 3000
            }
        );

        const { results: usersResults, error: usersError } = await withRetry(
            () => getAllDocuments("users"),
            {
                maxAttempts: 3,
                initialDelay: 500,
                maxDelay: 3000
            }
        );

        if (usersError || !usersResults) {
            return NextResponse.json({ message: "Error fetching users", error: usersError }, { status: 500 });
        }

        const usersMap = new Map(usersResults.docs.map(doc => [doc.data().username, doc.data()]));

        const posts = postsSnapshot.docs.map(doc => {
            const data = doc.data() as Post;
            const user = usersMap.get(data.username);
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
                profilePicture: user ? user.image : '',
                postType: 'posts',
                createdAt: data.createdAt ?? new Date(0).toISOString(),
            };
        });

        const hasMore = posts.length === pageSize;
        const lastVisible = posts.length > 0 ? {
            id: postsSnapshot.docs[postsSnapshot.docs.length - 1].id,
            data: postsSnapshot.docs[postsSnapshot.docs.length - 1].data()
        } : null;

        const responseData = { 
            success: true, 
            posts,
            hasMore,
            lastDoc: lastVisible ? JSON.stringify(lastVisible) : null
        };

        cache.set(`user-posts-${page}-${pageSize}`, responseData);
        console.log(`[CACHE UPDATE] Stored new user posts for page ${page} in server cache.`);

        return new Response(JSON.stringify(responseData), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=30, stale-while-revalidate=30'
            },
        });

    } catch (err) {
        console.error("Unexpected error:", err);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch posts' },
            { status: 500 }
        );
    }
}
