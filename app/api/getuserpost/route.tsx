import { NextResponse } from "next/server";
import { getAllDocuments } from "@/firebase/firestore/getData";
import { Comment } from "@/types/comment";

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
    try{
        const { results: postsResults, error: postsError } = await getAllDocuments("posts");
        // console.log("Posts Results:", postsResults); // Comment this out
        const { results: usersResults, error: usersError } = await getAllDocuments("users");
        // console.log("Users Results:", usersResults); // Comment this out

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

        return NextResponse.json({ 
            success: true, 
            posts: posts
          });
    } catch (err) {
        console.error("Unexpected error:", err);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch posts' },
            { status: 500 }
          );
    }
}
