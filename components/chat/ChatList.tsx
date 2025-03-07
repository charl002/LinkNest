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

  const currentUser = users.find(user => user.email === session?.user?.email)?.username || null;

  useEffect(() => {
    async function fetchUsersAndUnreadMessages() {
      try {
        // 🔹 Fetch all users
        const response = await fetch("/api/getalluser");
        const data = await response.json();
        if (data && Array.isArray(data.users)) {
          setUsers(data.users as User[]);
        } else {
          console.error("Unexpected API response:", data);
          setUsers([]);
        }
        
        if (currentUser) {
          const unreadResponse = await fetch(`/api/getunreadmessage?receiver=${currentUser}`);
          const unreadData = await unreadResponse.json();

          console.log("unreadData", unreadData);

          if (unreadResponse.ok) {
            setUnreadMessages(unreadData.unreadCounts);
          } else {
            console.error("Error fetching unread messages:", unreadData.message);
          }
        }
      } catch (error) {
        console.error("Error fetching users or unread messages:", error);
        setUsers([]);
      }
    }
  
    fetchUsersAndUnreadMessages();
  }, [currentUser]);

  useEffect(() => {
    if (!socket || !currentUser) return;
  
    socket.on("privateMessage", async (data: { senderId: string; receiverId: string }) => {
      if (data.receiverId === currentUser) {
        // Update unread count locally
        setUnreadMessages((prev) => ({
          ...prev,
          [data.senderId]: (prev[data.senderId] || 0) + 1,
        }));
  
        // Save unread count to Firestore via API
        try {
          await fetch("/api/postunreadmessage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sender: data.senderId,
              receiver: data.receiverId,
              count: 1
            }),
          });
        } catch (error) {
          console.error("Error storing unread message:", error);
        }
      }
    });
  
    return () => {
      socket.off("privateMessage");
    };
  }, [currentUser, socket]);
  

  const openChat = async (friendUsername: string, currentUsername: string | null) => {
    if (!currentUsername) return;
  
    setUnreadMessages((prev) => ({
      ...prev,
      [friendUsername]: 0, // Reset unread count locally
    }));
  
    try {
      await fetch("/api/postunreadmessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: friendUsername,
          receiver: currentUsername,
          count: 0, // Reset count in Firestore
        }),
      });
    } catch (error) {
      console.error("Error resetting unread count:", error);
    }
  
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