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

export default function ProfilePage( { user }: { user: string } ) {

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
    <div className="p-6">
      <h1 className="text-2xl font-bold">{user} Profile</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {userData && (
        <div>
          <h2 className="text-xl font-semibold">User ID: {userData.id}</h2>
          <Image
            src={userData.data.image}
            alt="User Profile"
            width={40}
            height={40}
            className="rounded-full border border-gray-300"
          />
          <p>Name: {userData.data.name}</p>
          <p>Email: {userData.data.email}</p>
          <p>Username: {userData.data.username}</p>
          <p>Description: {userData.data.description}</p>
        </div>
      )}
    </div>
  );

}