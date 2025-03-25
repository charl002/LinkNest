import { NextResponse } from "next/server";
import { withRetry } from '@/utils/backoff';
import { Comment } from "@/types/comment";
import cache from "@/lib/cache"; 
import { collection, query, orderBy, limit, startAfter, getDocs, getFirestore } from "firebase/firestore";
import firebase_app from "@/firebase/config";

interface NewsPost {
  uuid: string;
  title: string;
  description: string;
  keywords: string;
  url: string;
  image_url: string;
  createdAt: string;
  source: string;
  likes: number;
  likedBy: string[];
  comments: Comment[];
}

const db = getFirestore(firebase_app);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '0');
  const pageSize = parseInt(searchParams.get('limit') || '30');
  const lastDoc = searchParams.get('lastDoc');

  const cachedData = cache.get(`news-posts-${page}-${pageSize}`);
  if (cachedData) {
    console.log(`[SERVER CACHE] Returning cached news posts for page ${page}`);
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
      collection(db, "news"),
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
      const data = doc.data() as NewsPost;
      
      // Handle image verification with retries
      let processedImage = null;
      if (data.image_url) {
        try {
          await withRetry(async () => {
            const response = await fetch(data.image_url, { method: 'HEAD' });
            if (!response.ok) throw new Error('Image not available');
          });
          processedImage = {
            url: data.image_url,
            alt: data.title,
            thumb: data.image_url
          };
        } catch (error) {
          console.error(`Failed to verify image: ${data.image_url}`, error);
        }
      }

      return {
        title: data.title,
        username: data.source,
        description: data.description,
        tags: data.keywords.split(',').map(tag => tag.trim()),
        comments: data.comments.map((comment: Comment) => ({
          comment: comment.comment,
          username: comment.username,
          date: comment.date,
          likes: comment.likes || 0,
          likedBy: comment.likedBy || []
        })) || [],
        likes: data.likes || 0,
        images: processedImage ? [processedImage] : [],
        profilePicture: '',
        createdAt: data.createdAt,
        id: doc.id,
        postType: 'news',
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

    cache.set(`news-posts-${page}-${pageSize}`, responseData);
    console.log(`[CACHE UPDATE] Stored new news posts for page ${page} in server cache.`);

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=30'
      },
    });

  } catch (error) {
    console.error('Error in GET /api/news/getfromdb:', error);
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
