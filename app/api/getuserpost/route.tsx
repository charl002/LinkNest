import { NextResponse } from "next/server";
import { getAllDocuments } from "@/firebase/firestore/getData";
import { Comment } from "@/types/comment";
import { withRetry } from '@/utils/backoff';
import cache from '@/lib/cache';

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
export async function GET(){
    // Check cache first
    const cachedPosts = cache.get('user-posts');
    if (cachedPosts) {
        return NextResponse.json(cachedPosts);
    }

    try{
        const { results: postsResults, error: postsError } = await withRetry(
            () => getAllDocuments("posts"),
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

        if (postsError || !postsResults) {
            return NextResponse.json({ message: "Error fetching posts", error: postsError }, { status: 500 });
        }

        if (usersError || !usersResults) {
            return NextResponse.json({ message: "Error fetching users", error: usersError }, { status: 500 });
        }

        if (postsResults.empty) {
            return NextResponse.json({ posts: [] }, { status: 200 });
        }

        if (usersResults.empty) {
            return NextResponse.json({ posts: [] }, { status: 200 });
        }

        const usersMap = new Map(usersResults.docs.map(doc => [doc.data().username, doc.data()]));

        const posts = postsResults.docs.map(doc => {
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
                createdAt:  data.createdAt ?? new Date(0).toISOString(),
            };
        });

        const result = { success: true, posts: posts };
        
        // Store in cache
        cache.set('user-posts', result);

        return NextResponse.json(result);
        
    } catch (err) {
        console.error("Unexpected error:", err);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch posts' },
            { status: 500 }
          );
    }
}
