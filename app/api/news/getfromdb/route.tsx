import { NextResponse } from "next/server";
import { getAllDocuments } from "@/firebase/firestore/getData";
import { withRetry } from '@/utils/backoff';
import { Comment } from "@/types/comment";
import cache from "@/lib/cache"; 

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

export async function GET() {
  // Check server-side cache
  const cachedData = cache.get('news-posts');
  if (cachedData) {
   console.log("[SERVER CACHE] Returning cached news posts");
    return new Response(JSON.stringify(cachedData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      },
    });
  }

  console.log("[SERVER CACHE] Expired - Fetching new news posts from Firestore...");

  try {
    const { results, error } = await withRetry(
      () => getAllDocuments('news'),
      {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 5000
      }
    );

    if (error) {
      throw new Error('Failed to fetch news posts');
    }

    if (!results) {
      return new Response(JSON.stringify({ posts: [] }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        },
      });
    }

    const posts = await Promise.all(results.docs.map(async (doc) => {
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

    const responseData = {
      success: true, 
      posts: posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    };

    // Store in server cache
    cache.set('news-posts', responseData);
    console.log("[CACHE UPDATE] Stored new news posts in server cache.");

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
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
