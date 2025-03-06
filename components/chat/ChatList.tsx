"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useFriends } from "../provider/FriendsProvider";
import { Badge } from "@/components/ui/badge";
import { useSocket } from "@/components/provider/SocketProvider";

import { User } from "@/types/user";

export default function ChatList() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const router = useRouter(); // Use Next.js router

  const { friends} = useFriends();
  const socket = useSocket();
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});

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
    if (!socket || !session?.user?.email) return;
  
    socket.on("privateMessage", (data: { senderId: string, receiverId: string }) => {
      console.log("Received a new message from:", data.senderId);
  
      // Check if the message is sent to the current user

      console.log(data.receiverId);

      if (data.receiverId === currentUser) {
        setUnreadMessages((prev) => ({
          ...prev,
          [data.senderId]: (prev[data.senderId] || 0) + 1, // Increment count for sender
        }));
      }
    });
  
    return () => {
      socket.off("privateMessage");
    };
  }, [currentUser, socket, session?.user?.email]);

  const openChat = (friendUsername: string, currentUsername: string | null) => {
    if (!currentUsername) return;
    // Clear unread messages when opening chat
    setUnreadMessages(prev => ({
      ...prev,
      [friendUsername]: 0
    }));
    router.push(`/chat?friend=${friendUsername}&user=${currentUsername}`);
  };

  return (
    <aside className="bg-white shadow-md p-4 rounded-md">
      <h2 className="text-lg font-semibold mb-4">Friends</h2>
      <ScrollArea className="w-full max-h-120 overflow-y-auto">
        <div className="flex flex-col space-y-2">
          {friends.length > 0 ? (
            friends.map((user, index) => (
              <div 
                key={user.id || `${user.username}-${index}`}
                className="flex items-center justify-between p-2 bg-gray-100 rounded-md"
              >
                <Link href={`/profile/${encodeURIComponent(user.username)}`} className="flex items-center gap-x-3">
                  <div className="flex items-center space-x-2">
                    <Image 
                      src={user.image} 
                      alt={user.username} 
                      width={40} 
                      height={40} 
                      className="rounded-full border"
                    />
                    <p className="text-sm font-medium">{user.username}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  {unreadMessages[user.username] > 0 && (
                    <Badge variant="destructive">
                      {unreadMessages[user.username]}
                    </Badge>
                  )}
                  <Button onClick={() => openChat(user.username, currentUser)}>
                    Chat
                  </Button>
                </div>
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