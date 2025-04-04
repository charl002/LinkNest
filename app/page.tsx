"use client";

import UserCheck from "@/components/auth/UserCheck";
import Post from "@/components/post/Post";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import LoadingLogo from "../components/custom-ui/LoadingLogo";
import { PostType } from "@/types/post";


/**
 * The Home component is the main entry point for the app.
 * It handles fetching posts and rendering the appropriate content based on the user's authentication status.
 * If the user is authenticated, it renders the UserCheck component.
 * If the user is not authenticated, it displays posts and allows interaction with the public view.
 * 
 * @returns {JSX.Element} The rendered Home component.
 */
export default function Home() {
  const { status } = useSession();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [sessionUsername] = useState('');

  /**
   * Fetches posts from multiple sources and combines them into one list.
   * The posts are then shuffled randomly before being set in the state.
   */
  useEffect(() => {
    const fetchPosts = async () => {
      setLoadingPosts(true);
      try {
        // Fetch posts from different categories concurrently
        const [response, newsResponse, customResponse] = await Promise.all([
          fetch('/api/bluesky/getfromdb'),
          fetch('/api/news/getfromdb'),
          fetch('/api/getuserpost')
        ]);
      // Parse the responses into JSON
      const [data, newsData, customData] = await Promise.all([
          response.json(),
          newsResponse.json(),
          customResponse.json()
      ]);

        let allPosts: PostType[] = [];
        // Check if posts exist in each category and concatenate them
        if (data.success) {
          allPosts = allPosts.concat(data.posts);
        }
        if (newsData.success) {
          allPosts = allPosts.concat(newsData.posts);
        }
        if (customData.success) {
          allPosts = allPosts.concat(customData.posts);
        }
        // Shuffle the posts randomly for variety
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

  /**
   * Renders a loading screen if posts are still being fetched.
   */
  if (loadingPosts) {
    return <LoadingLogo />;
  }
  // If authenticated, render UserCheck component
  if (status === "authenticated") {
    return <UserCheck />;
  }

  // Render the public view for non-authenticated users
  return (
    <div className="flex flex-col items-center gap-6 p-6 w-full h-[calc(100vh-90px)] overflow-y-auto">
      <section className="flex flex-col space-y-6 max-w-2xl w-full h-[calc(100vh-120px)]">
        {posts.map((post, index) => (
          <Post 
            key={`${post.id}-${index}`} 
            {...post} 
            profilePicture={post.profilePicture} 
            documentId={post.id}
            postType={post.postType} 
            sessionUsername={sessionUsername}
          />
        ))}
      </section>
    </div>
  );
}
