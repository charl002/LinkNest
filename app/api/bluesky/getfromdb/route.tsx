import { NextResponse } from "next/server";
import { withRetry } from '@/utils/backoff';
import { Comment } from "@/types/comment";
import cache from "@/lib/cache";
import { collection, query, orderBy, limit, startAfter, getDocs, getFirestore } from "firebase/firestore";
import firebase_app from "@/firebase/config";

const db = getFirestore(firebase_app);

interface BlueskyPost {
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
  likes: number;
  likedBy: string[];
  comments: Comment[];
}

export async function GET(request: Request) {
   const { searchParams } = new URL(request.url);
   const page = parseInt(searchParams.get('page') || '0');
   const pageSize = parseInt(searchParams.get('limit') || '30');
   const lastDoc = searchParams.get('lastDoc');

   const cachedData = cache.get(`bluesky-posts-${page}-${pageSize}`);
   if (cachedData) {
    console.log(`[SERVER CACHE] Returning cached bluesky posts for page ${page}`);
     return new Response(JSON.stringify(cachedData), {
       status: 200,
       headers: {
         'Content-Type': 'application/json',
         'Cache-Control': 'public, max-age=30, stale-while-revalidate=30'
       },
     });
   }

   try {
    const baseQuery = query(
        collection(db, "bluesky"),
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
            initialDelay: 1000,
            maxDelay: 5000
        }
    );

    if (!postsSnapshot.docs) {
        return NextResponse.json({ 
            success: true,
            posts: [],
            hasMore: false
        }, { status: 200 });
    }

    const posts = await Promise.all(postsSnapshot.docs.map(async (doc) => {
        const data = doc.data() as BlueskyPost;
        
        // Handle image loading with retries
        let processedImages: Array<{url: string; alt: string; thumb: string} | null> = [];
        if (data.images && data.images.length > 0) {
          processedImages = await Promise.all(
            data.images.map(async (image) => {
              try {
                // Verify image availability
                await withRetry(async () => {
                  const response = await fetch(image.url, { method: 'HEAD' });
                  if (!response.ok) throw new Error('Image not available');
                });
                return image;
              } catch (error) {
                console.error(`Failed to verify image: ${image.url}`, error);
                return null;
              }
            })
          );
          // Filter out failed images
          processedImages = processedImages.filter(img => img !== null);
        }

        return {
            title: data.text.substring(0, 50) + (data.text.length > 50 ? '...' : ''),
            username: data.author.displayName,
            description: data.text,
            tags: [],
            comments: data.comments.map((comment) => ({
                comment: comment.comment,
                username: comment.username,
                date: comment.date,
                likes: comment.likes || 0,
                likedBy: comment.likedBy || []
            })),
            likes: data.likes || 0,
            images: processedImages,
            createdAt: data.createdAt,
            id: doc.id,
            profilePicture: data.author.avatar,
            postType: 'bluesky',
            likedBy: data.likedBy
        };
    }));

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

    cache.set(`bluesky-posts-${page}-${pageSize}`, responseData);
    console.log(`[CACHE UPDATE] Stored new bluesky posts for page ${page} in server cache.`);

    return NextResponse.json(responseData, {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=30, stale-while-revalidate=30'
        },
    });

   } catch (error) {
    console.error('Error in GET /api/bluesky/getfromdb:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch posts',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
