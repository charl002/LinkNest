"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import { useFriends } from "../provider/FriendsProvider";
import { useSocket } from "@/components/provider/SocketProvider";
import { useSearchParams } from "next/navigation"; 
import { User } from "@/types/user";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import FriendsList from "./FriendsList";
import GroupChatsList from "./GroupChatsList";
import { decryptMessage } from "@/utils/decrypt";

export default function ChatList() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const router = useRouter(); // Use Next.js router

  const { friends } = useFriends();
  const socket = useSocket();
  const [unreadMessages, setUnreadMessages] = useState<Record<string, { count: number; message: string }>>({});

  const currentUser = users.find(user => user.email === session?.user?.email)?.username || null;

  const searchParams = useSearchParams();
  const activeChatFriend = searchParams.get("friend");

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

          if (unreadResponse.ok) {
            if (unreadData?.unreadCounts && typeof unreadData.unreadCounts === 'object') {
              // Check if groupId is present to handle only group chat messages

              if (unreadData.unreadCounts.groupId) {
                // Skip setting unread messages for group chats
                console.log("This is a group chat message, skipping unread message update.");
              } else {
                // Add a check to see if the message is undefined. React on strict mode calls the useEffect twice, so I made it pass an empty string when it gets an undefined value.
                Object.keys(unreadData.unreadCounts).forEach((sender) => {
                  const encryptedMsg = unreadData.unreadCounts[sender].message;
                  unreadData.unreadCounts[sender].message = encryptedMsg
                    ? decryptMessage(encryptedMsg)
                    : ""; // or leave it undefined/null if you prefer
                });
          
                setUnreadMessages(unreadData.unreadCounts); // Set unread message counts for private chats
              }
            } else {
              console.warn("unreadCounts is missing or not an object", unreadData);
              setUnreadMessages({});
            }
          } else {
            console.error("Error fetching unread messages:", unreadData?.message || "Unknown error");
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

    socket.on("privateMessage", async (data: { senderId: string; receiverId: string, message: string }) => {
      if (data.receiverId !== currentUser) return; // Ignore messages not meant for the current user

      // Decrypt the message if it exists (same logic as before)
      const decryptedMessage = data.message ? decryptMessage(data.message) : "";

      // This will increment the unread msg count if you are not currently chatting with this person.
      setUnreadMessages((prev = {}) => {
        if (activeChatFriend === data.senderId) {
          return { ...prev, [data.senderId]: { count: 0, message: "" } }; // Reset unread count when chat is opened
        }
  
        return {
          ...prev,
          [data.senderId]: {
            count: (prev[data.senderId]?.count || 0) + 1,
            message: decryptedMessage, // Store the latest message as a snippet
          },
        };
      });

      console.log(activeChatFriend);
      console.log(data.senderId);

      // Check if the receiver is online, if not update Firestore
      if (activeChatFriend === data.senderId) {
        try {
          await fetch("/api/postunreadmessage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sender: data.senderId,
              receiver: data.receiverId,
              count: 0, // Reset unread count
              message: '',
              groupId: null
            }),
          });
        } catch (error) {
          console.error("Error resetting unread count:", error);
        }
        return;
      }
    });

    return () => {
      socket.off("privateMessage");
    };
  }, [currentUser, socket, activeChatFriend]);

  return (
    <aside className="bg-white shadow-md p-4 rounded-md h-[calc(100vh-120px)] overflow-y-auto">
      <Tabs defaultValue="friends">
        <TabsList className="flex gap-4">
          <TabsTrigger value="friends">Friends</TabsTrigger>
          <TabsTrigger value="groupChats">Group Chats</TabsTrigger>
        </TabsList>

        <TabsContent value="friends">
          <h2 className="text-lg font-semibold mb-4">Friends</h2>
          <ScrollArea className="w-full max-h-120 overflow-y-auto">
            <FriendsList 
              unreadMessages={unreadMessages}
              setUnreadMessages={setUnreadMessages}
              currentUser={currentUser}
              router={router}
              friends={friends}
            />
          </ScrollArea>
          
        </TabsContent>

        <TabsContent value="groupChats">
          <h2 className="text-lg font-semibold mb-4">Group Chats</h2>
          <ScrollArea className="w-full max-h-120 overflow-y-auto">
            <GroupChatsList 
              router={router}
              currentUser={currentUser}
            />
          </ScrollArea>
          
        </TabsContent>
      </Tabs>
    </aside>
  );
}