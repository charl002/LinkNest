"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface UserData {
  id: string;
  data: {
    name: string;
    username: string;
    image: string;
    description: string;
  };
}

export default function ProfilePage({ user }: { user: string }) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [friendsCount, setFriendsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
              <button className="px-4 py-2 bg-blue-500 text-white text-sm rounded-full">
                Profile settings
              </button>
            </div>

            <div className="mt-3 flex space-x-6 text-gray-500 text-sm">
              <p>
                <span className="font-bold text-black">10</span> Posts
              </p>
              <p>
                <span className="font-bold text-black">{friendsCount}</span> Friends
              </p>
            </div>

            <div className="mt-4 flex border-b text-sm">
              <p className="text-blue-500 font-semibold border-b-2 border-blue-500 pb-2 px-4">
                Posts
              </p>
            </div>
          </div>

          <div className="p-4 space-y-6"></div>
        </div>
      )}
    </div>
  );
}
