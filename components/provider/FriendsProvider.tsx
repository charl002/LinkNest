"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useSocket } from "./SocketProvider";
import { customToast } from "../ui/customToast";

import { User } from "@/types/user";

interface FriendsContextType {
  friends: User[];
  setFriends: React.Dispatch<React.SetStateAction<User[]>>;
}

const FriendsContext = createContext<FriendsContextType | undefined>(undefined);

export function FriendsProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [friends, setFriends] = useState<User[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const socket = useSocket();

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

  useEffect(() => {
    if (!socket || !session?.user?.email) return;
  
    const fetchFriends = async () => {
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
    };
  
    // Fetch friends initially
    fetchFriends();
  
    // **Listen for friend list updates**
    socket.on("updateFriendsList", () => fetchFriends());
  
    socket.on("friendRequestAccepted", ({ acceptedBy }) => {
      console.log(`Received friendRequestAccepted event for ${acceptedBy}`);
      customToast({ message: `You are now friends with ${acceptedBy}!`, type: "success" });
    });
  
    return () => {
      socket.off("updateFriendsList");
      socket.off("friendRequestAccepted");
    };
  }, [session?.user?.email, socket, username]);

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
