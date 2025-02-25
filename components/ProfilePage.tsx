"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Post from "./Post"; 
import { useSession } from "next-auth/react";

interface UserData {
  id: string;
  data: {
    name: string;
    username: string;
    email: string;
    image: string;
    description: string;
  };
}

interface PostData {
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

export default function ProfilePage({ user }: { user: string }) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [friendsCount, setFriendsCount] = useState<number>(0);
  const [postsCount, setPostsCount] = useState<number>(0);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const email = session?.user?.email;

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch(`/api/getuserbyusername?username=${user}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to fetch user");
        }

        setUserData(result);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    async function fetchFriends() {
      try {
        const response = await fetch(`/api/getfriends?username=${user}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to fetch friends");
        }

        setFriendsCount(result.friends.length);
      } catch (err) {
        console.error("Error fetching friends:", err);
      }
    }

    async function fetchPosts() {
      try {
        const response = await fetch(`/api/getpostbyusername?username=${user}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to fetch friends");
        }

        setPostsCount(result.posts.length);
        setPosts(result.posts);
      } catch (err) {
        console.error("Error fetching friends:", err);
      }
    }

    
    fetchPosts();
    fetchUser();
    fetchFriends();
  }, [user]);

  return (
    <div className="bg-white min-h-screen w-full text-gray-800">
      {loading && <p className="text-center py-6">Loading...</p>}
      {error && <p className="text-red-500 text-center py-6">{error}</p>}

      {userData && (
        <div className="w-full h-full mx-auto border border-gray-300 shadow-sm rounded-lg overflow-hidden">
      
          <div className="w-full h-32 bg-gray-300 relative">
            <Image
              src={userData.data.image}
              alt="User Profile"
              layout="fill"
              objectFit="cover"
            />
          </div>

          <div className="p-4 relative">
            <div className="absolute -top-12 left-4">
              <Image
                src={userData.data.image}
                alt="User Profile"
                width={80}
                height={80}
                className="rounded-full border-4 border-white shadow-md"
              />
            </div>

            <div className="mt-8 flex justify-between items-center">
              <div>
                <p className="text-lg font-bold">{userData.data.name}</p>
                <p className="text-gray-500">@{userData.data.username}</p>
                <br />
                <p className="text-gray-700">{userData.data.description}</p>
              </div>
              {userData.data.email === email ? (
                <button className="px-4 py-2 bg-blue-500 text-white text-sm rounded-full">
                  Profile settings
                </button>
              ) : (
                <button className="px-4 py-2 bg-blue-500 text-white text-sm rounded-full">
                  Add Friend
                </button>
              )}
            </div>

            <div className="mt-3 flex space-x-6 text-gray-500 text-sm">
              <p>
                <span className="font-bold text-black">{postsCount}</span>
                {postsCount === 1 || postsCount == 0 ? " Post" : " Posts"}
              </p>
              <p>
                <span className="font-bold text-black">{friendsCount}</span> 
                {friendsCount === 1 || friendsCount == 0 ? " Friend" : " Friends"}
              </p>
            </div>

            <div className="mt-4 flex border-b text-sm">
              <p className="text-blue-500 font-semibold border-b-2 border-blue-500 pb-2 px-4">
                Posts
              </p>
            </div>
          </div>

          <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-320px)]">
            {postsCount > 0 ? (posts.map((post, index) => 
              <Post 
                  key={`${post.id}-${index}`} 
                  {...post} 
                  profilePicture={userData.data.image || ""}
              />)
              ) : (
              <p className="text-gray-600">No posts available.</p>
          )}
          </div>
        </div>
      )}
    </div>
  );
}
