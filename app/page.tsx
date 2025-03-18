"use client";

import UserCheck from "@/components/auth/UserCheck";
import Post from "@/components/post/Post";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import LoadingLogo from "../components/custom-ui/LoadingLogo";
import { PostType } from "@/types/post";
import { useInView } from 'react-intersection-observer';

export default function Home() {
  const { status } = useSession();
  const [posts, setPosts] = useState<PostType[]>([]);
  const [allPosts, setAllPosts] = useState<PostType[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [sessionUsername] = useState('');
  const [pageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px'
  });

  useEffect(() => {
    const fetchPosts = async () => {
      setLoadingPosts(true);
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

        let fetchedPosts: PostType[] = [];

        if (data.success) fetchedPosts = fetchedPosts.concat(data.posts);
        if (newsData.success) fetchedPosts = fetchedPosts.concat(newsData.posts);
        if (customData.success) fetchedPosts = fetchedPosts.concat(customData.posts);

        const shuffledPosts = fetchedPosts.sort(() => Math.random() - 0.5);
        setAllPosts(shuffledPosts);
        setPosts(shuffledPosts.slice(0, pageSize));
        setHasMore(shuffledPosts.length > pageSize);
        setCurrentPage(0);
      } catch (err) {
        console.error("Error fetching posts:", err);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchPosts();
  }, [pageSize]);

  useEffect(() => {
    if (inView && hasMore && !loadingPosts) {
      const nextPage = currentPage + 1;
      const start = nextPage * pageSize;
      const end = start + pageSize;

      const nextBatch = allPosts.slice(start, end);
      
      if (nextBatch.length > 0) {
        setPosts(prev => [...prev, ...nextBatch]);
        setCurrentPage(nextPage);
        setHasMore(end < allPosts.length);
      } else {
        setHasMore(false);
      }
    }
  }, [inView, hasMore, currentPage, pageSize, loadingPosts, allPosts]);

  if (loadingPosts) {
    return <LoadingLogo />;
  }

  if (status === "authenticated") {
    return <UserCheck />;
  }

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
        {hasMore && (
          <div ref={ref} className="h-20 flex items-center justify-center">
            {loadingPosts && <LoadingLogo />}
          </div>
        )}
      </section>
    </div>
  );
}