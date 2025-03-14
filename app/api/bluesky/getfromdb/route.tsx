import { NextResponse } from "next/server";
import { getAllDocuments } from "@/firebase/firestore/getData";
import { withRetry } from '@/utils/backoff';
import { Comment } from "@/types/comment";

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

export async function GET() {
  try {
    const { results, error } = await withRetry(
      () => getAllDocuments('bluesky'),
      {
        maxAttempts: 3,
        initialDelay: 1000,
        maxDelay: 5000
      }
    );

    if (error) {
      throw new Error('Failed to fetch Bluesky posts');
    }

    if (!results) {
      return NextResponse.json({ posts: [] });
    }

    const posts = await Promise.all(results.docs.map(async (doc) => {
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

    return NextResponse.json({ 
      success: true, 
      posts: posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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
