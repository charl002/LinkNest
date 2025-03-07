"use client";

import Post from "@/components/post/Post";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import LoadingLogo from "../components/custom-ui/LoadingLogo";

interface Post {
  id: string;
  title: string;
  username: string;
  description: string;
  tags: string[];
  comments: { comment: string; username: string; date: string; likes: number, likedBy: string[] }[];
  likes: number;
  images: { url: string; alt: string; thumb: string }[];
  createdAt: string;
  profilePicture: string;
  postType: 'posts' | 'bluesky' | 'news';
  likedBy: string[];
}

export default function Home() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [sessionUsername, setSessionUsername] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      setLoadingPosts(true);

      const sessionEmail = session?.user?.email;

      const response = await fetch(`/api/getsingleuser?email=${sessionEmail}`);
      const sessionUser = await response.json();

      if (response.ok) {
        setSessionUsername(sessionUser.data.username)
    } else {
        console.error(sessionUser.message);
    }
      try {
        const [response, newsResponse, customResponse] = await Promise.all([
          fetch('/api/bluesky/getfromdb'),
          fetch('/api/news/getfromdb'),
          fetch('/api/getuserpost')
      ]);

      const [data, newsData, customData] = await Promise.all([
          response.json(),
          newsResponse.json(),
          customResponse.json()
      ]);

        let allPosts: Post[] = [];

        if (data.success) {
          allPosts = allPosts.concat(data.posts);
        }
        if (newsData.success) {
          allPosts = allPosts.concat(newsData.posts);
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
    return <LoadingLogo></LoadingLogo>;
  }

  return (
    <div className="flex flex-col items-center gap-6 p-6 w-full h-screen">
      <section className="flex flex-col space-y-6 max-w-2xl w-full h-full overflow-y-auto">
        {posts.map((post, index) => (
          <Post key={`${post.id}-${index}`} {...post} profilePicture={post.profilePicture} documentId={post.id}
          postType={post.postType} sessionUsername={sessionUsername}/>
        ))}
      </section>
    </div>
  );
}