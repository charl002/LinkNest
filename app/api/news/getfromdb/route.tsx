import { NextResponse } from "next/server";
import { getAllDocuments } from "@/firebase/firestore/getData";

interface NewsPost {
  uuid: string;
  title: string;
  description: string;
  keywords: string;
  url: string;
  image_url: string;
  published_at: string;
  source: string;
  likes: number;
}

export async function GET() {
  try {
    const { results, error } = await getAllDocuments('news');

    if (error) {
      throw new Error('Failed to fetch news posts');
    }

    if (!results) {
      return NextResponse.json({ posts: [] });
    }

    const posts = results.docs.map(doc => {
      const data = doc.data() as NewsPost;
      return {
        title: data.title,
        username: data.source, // Assuming source is used as username
        description: data.description,
        tags: data.keywords.split(',').map(tag => tag.trim()), // Split keywords into tags
        comments: [], // Comments can be added later if needed
        likes: data.likes || 0,
        images: [{ url: data.image_url, alt: data.title, thumb: data.image_url }], // Create image object
        profilePicture: '', // Set profile picture if available
        published_at: data.published_at, // Add published_at to the returned object
        id: doc.id,
        postType: 'news'
      };
    });

    return NextResponse.json({ 
      success: true, 
      posts: posts.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
    });

  } catch (error) {
    console.error('Error in GET /api/news/getfromdb:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
