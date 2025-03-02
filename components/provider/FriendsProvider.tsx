"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";

interface User {
  id: string;
  image: string;
  username: string;
  name: string;
  email: string;
}

interface FriendsContextType {
  friends: User[];
  setFriends: React.Dispatch<React.SetStateAction<User[]>>;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

export function FriendsProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [friends, setFriends] = useState<User[]>([]);
  const [username, setUsername] = useState<string | null>(null);

  // First, fetch the username using the session email
  useEffect(() => {
    if (!session?.user?.email) return;

    async function fetchUsername() {
      try {
        const response = await fetch(`/api/getsingleuser?email=${session?.user?.email}`);
        const data = await response.json();

        if (response.ok && data?.data?.username) {
          setUsername(data.data.username);
        } else {
          console.error("Error fetching username:", data.message);
        }
      } catch (error) {
        console.error("Error fetching username:", error);
      }
    }

    fetchUsername();
  }, [session]);

  // Once we have the username, fetch friends list
  useEffect(() => {
    if (!username) return;

    async function fetchFriends() {
      try {
        const response = await fetch(`/api/getfriends?username=${username}`);
        const data = await response.json();

        if (!response.ok) {
          console.error("Error fetching friends:", data);
          return;
        }

        const friendsData = await Promise.all(
          data.friends.map(async (friendUsername: string) => {
            const userResponse = await fetch(`/api/getuserbyusername?username=${friendUsername}`);
            const userData = await userResponse.json();
            return userResponse.ok ? { id: userData.id, ...userData.data } : null;
          })
        );

        setFriends(friendsData.filter(Boolean));
      } catch (error) {
        console.error("Error fetching friends:", error);
      }
    }

    fetchFriends();
  }, [username]);

  return (
    <FriendsContext.Provider value={{ friends, setFriends }}>
      {children}
    </FriendsContext.Provider>
  );
}

export function useFriends() {
  const context = useContext(FriendsContext);
  if (!context) {
    throw new Error("useFriends must be used within a FriendsProvider");
  }
  return context;
}
