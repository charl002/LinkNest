import { NextResponse } from "next/server";
import { getAllDocuments } from "@/firebase/firestore/getData";

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
  comments: { comment: string; username: string; date: string; likes: number, likedBy: string[] }[];
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
        comments: data.comments.map((comment: { comment: string; username: string; date: string; likes: number, likedBy: string[] }) => ({
          comment: comment.comment,
          username: comment.username,
          date: comment.date,
          likes: comment.likes || 0,
          likedBy: comment.likedBy || []
        })) || [],
        likes: data.likes || 0,
        images: [{ url: data.image_url, alt: data.title, thumb: data.image_url }], // Create image object
        profilePicture: '', // Set profile picture if available
        createdAt: data.createdAt, // Add published_at to the returned object
        id: doc.id,
        postType: 'news',
        likedBy: data.likedBy
      };
    });

    return NextResponse.json({ 
      success: true, 
      posts: posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    });

  } catch (error) {
    console.error('Error in GET /api/news/getfromdb:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
