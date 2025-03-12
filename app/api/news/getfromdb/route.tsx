import { NextResponse } from "next/server";
import { getAllDocuments } from "@/firebase/firestore/getData";
import { withRetry } from '@/utils/backoff';
import { Comment } from "@/types/comment";

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
      return NextResponse.json({ posts: [] });
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

    return NextResponse.json({ 
      success: true, 
      posts: posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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
