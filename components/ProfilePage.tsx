"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface UserData {
  id: string;
  data: {
    name: string;
    email: string;
    image: string;
    username: string;
    description: string;
  };
}

export default function ProfilePage({ user }: { user: string }) {
  const [userData, setUserData] = useState<UserData | null>(null);
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

    fetchUser();
  }, [user]);

  return (
    <div className="bg-white shadow-md rounded-lg p-6 text-center border border-gray-300">
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {userData && (
        <div>
          <div className="flex items-center justify-around my-4">
            <div className="flex flex-col items-center">
              <p className="font-bold text-lg">{userData.data.username}</p>
              <Image
                src={userData.data.image}
                alt="User Profile"
                width={80}
                height={80}
                className="rounded-full border border-gray-400 mt-2"
              />
            </div>
            
            <div className="text-center">
              <p className="font-semibold">Posts</p>
              <p>10</p>
            </div>
            <div className="text-center">
              <p className="font-semibold">Followers</p>
              <p>100</p>
            </div>
            <div className="text-center">
              <p className="font-semibold">Following</p>
              <p>200</p>
            </div>
          </div>

          <div className="ml-4 text-left">
            <p className="font-semibold">{userData.data.name}</p>
            <p className="text-gray-600">{userData.data.description}</p>
          </div>

          <h3 className="font-semibold mt-4">Posts</h3>
          <div className="w-full h-40 bg-gray-200 rounded-md flex items-center justify-center mt-2">
            <p className="text-gray-500">Post Placeholder</p>
          </div>
        </div>
      )}
    </div>
  );
}
