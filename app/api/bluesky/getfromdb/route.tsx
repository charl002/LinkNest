import { NextResponse } from "next/server";
import { getAllDocuments } from "@/firebase/firestore/getData";

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
}

export async function GET() {
  try {
    const { results, error } = await getAllDocuments('bluesky');

    if (error) {
      throw new Error('Failed to fetch Bluesky posts');
    }

    if (!results) {
      return NextResponse.json({ posts: [] });
    }

    const posts = results.docs.map(doc => {
      const data = doc.data() as BlueskyPost;
      return {
        title: data.text.substring(0, 50) + (data.text.length > 50 ? '...' : ''), // Create title from first 50 chars
        username: data.author.displayName,
        description: data.text,
        tags: [], // You might want to add tags extraction logic here
        comments: [], // Comments can be added later if needed
        likes: data.likes || 0,
        images: data.images || [],
        createdAt: data.createdAt,
        id: doc.id,
        avatar: data.author.avatar
      };
    });

    return NextResponse.json({ 
      success: true, 
      posts: posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    });

  } catch (error) {
    console.error('Error in GET /api/bluesky/getfromdb:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
