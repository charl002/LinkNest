import { NextResponse } from "next/server";
import { getAllDocuments } from "@/firebase/firestore/getData";

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
    comments: { comment: string; username: string; date: string; likes: number }[];
}
export async function GET(){
    try{
        const { results: postsResults, error: postsError } = await getAllDocuments("posts");
        console.log("Posts Results:", postsResults);
        const { results: usersResults, error: usersError } = await getAllDocuments("users");
        console.log("Users Results:", usersResults);

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
                comments: data.comments.map((comment: { comment: string; username: string; date: string; likes: number }) => ({
                    comment: comment.comment,
                    username: comment.username,
                    date: comment.date,
                    likes: comment.likes || 0
                })) || [],
                likes: data.likes || 0,
                images: [{ url: data.fileUrl, alt: data.title, thumb: data.fileUrl }],
                profilePicture: user ? user.image : '',
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
