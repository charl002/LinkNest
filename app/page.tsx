"use client";

import Post from "@/components/Post";
import { useEffect, useState } from "react";

interface Post {
  id: string;
  title: string;
  username: string;
  description: string;
  tags: string[];
  comments: string[];
  likes: number;
  images: { url: string; alt: string; thumb: string }[];
  createdAt: string;
  avatar: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('/api/bluesky/getfromdb');
        const newsresponse = await fetch('/api/news/getfromdb');
        const data = await response.json();
        const newsdata = await newsresponse.json();
        let allPosts: Post[] = [];

        if (data.success) {
          allPosts = allPosts.concat(data.posts);
        }
        if (newsdata.success) {
          allPosts = allPosts.concat(newsdata.posts);
        }

        const shuffledPosts = allPosts.sort(() => Math.random() - 0.5);
        setPosts(shuffledPosts);
      } catch (err) {
        console.error("Error fetching posts:", err);
      }
    };

    fetchPosts();
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 p-6 w-full">
      <section className="flex flex-col space-y-6 max-w-2xl w-full">
        {posts.map((post, index) => (
          <Post key={`${post.id}-${index}`} {...post} profilePicture={post.avatar}/>
        ))}
      </section>
    </div>
  );
}