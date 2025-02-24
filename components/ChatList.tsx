"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "./ui/button";
import Link from "next/link";

interface User {
  id: string;
  image: string;
  username: string;
  name: string;
  email: string;
}

export default function ChatList() {
  const { data: session } = useSession();
  const [friends, setFriends] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch("/api/getalluser");
        const data = await response.json();

        if (data && Array.isArray(data.users)) {
          setUsers(data.users as User[]);
        } else {
          console.error("Unexpected API response:", data);
          setUsers([]);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        setUsers([]);
      }
    }
    fetchUsers();
  }, []);

  const currentUser = users.find(user => user.email === session?.user?.email)?.username || null;

  useEffect(() => {
    if (!currentUser) return;

    async function fetchFriends() {
      try {
        const response = await fetch(`/api/getfriends?username=${currentUser}`);
        const data = await response.json();

        if (!response.ok) {
          console.error("Error fetching friends:", data);
          return;
        }
        const friendsData = await Promise.all(
          data.friends.map(async (friendUsername: string) => {
            const userResponse = await fetch(`/api/getuserbyusername?username=${friendUsername}`);
            const userData = await userResponse.json();

            if (userResponse.ok) {
              return { id: userData.id, ...userData.data };
            } else {
              console.error(`User ${friendUsername} not found`);
              return null;
            }
          })
        );

        setFriends(friendsData.filter(Boolean));
      } catch (error) {
        console.error("Error fetching friends:", error);
      }
    }

    fetchFriends();
  }, [currentUser]);

  return (
    <aside className="bg-white shadow-md p-4 rounded-md">
      <h2 className="text-lg font-semibold mb-4">Friends</h2>
      <ScrollArea className="w-full max-h-60 overflow-y-auto">
        <div className="flex flex-col space-y-2">
          {friends.length > 0 ? (
            friends.map((user) => (
              <div 
                key={user.id} 
                className="flex items-center justify-between p-2 bg-gray-100 rounded-md"
              >
                <Link href={`/profile/${encodeURIComponent(user.username)}`}>
                <div className="flex items-center space-x-2">
                  <Image 
                    src={user.image} 
                    alt={user.username} 
                    width={40} 
                    height={40} 
                    className="rounded-full border"
                  />
                  <p>{user.username}</p>
                </div>
                </Link>
                <Button>Chat</Button>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No friends found</p>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
