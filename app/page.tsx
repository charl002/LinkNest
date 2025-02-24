"use client";

import Post from "@/components/Post";
import { useEffect, useState } from "react";

interface Post {
  id: string;
  title: string;
  username: string;
  description: string;
  tags: string[];
  comments: { comment: string; username: string; date: string; likes: number }[];
  likes: number;
  images: { url: string; alt: string; thumb: string }[];
  createdAt: string;
  profilePicture: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoadingPosts(true);
      try {
        const response = await fetch('/api/bluesky/getfromdb');
        const newsresponse = await fetch('/api/news/getfromdb');
        const data = await response.json();
        const newsdata = await newsresponse.json();

        const customResponse = await fetch('/api/getuserpost');
        const customData = await customResponse.json();

        let allPosts: Post[] = [];

        if (data.success) {
          allPosts = allPosts.concat(data.posts);
        }
        if (newsdata.success) {
          allPosts = allPosts.concat(newsdata.posts);
        }
        if (customData.success) {
          allPosts = allPosts.concat(customData.posts);
        }

        const shuffledPosts = allPosts.sort(() => Math.random() - 0.5);
        setPosts(shuffledPosts);
      } catch (err) {
        console.error("Error fetching posts:", err);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchPosts();
  }, []);

  if (loadingPosts) {
    return <div>Loading posts...</div>;
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6 w-full h-screen">
      <section className="flex flex-col space-y-6 max-w-2xl w-full h-full overflow-y-auto">
        {posts.map((post, index) => (
          <Post key={`${post.id}-${index}`} {...post} profilePicture={post.profilePicture} />
        ))}
      </section>
    </div>
  );
}