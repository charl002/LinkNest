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
              
              // Add a check to see if the message is undefined. React on strict mode calls the useEffect
              // twice, so I made it pass an empty string when it gets an undefined value.
              Object.keys(unreadData.unreadCounts).forEach((sender) => {
                const encryptedMsg = unreadData.unreadCounts[sender].message;
                unreadData.unreadCounts[sender].message = encryptedMsg
                  ? decryptMessage(encryptedMsg)
                  : ""; // or leave it undefined/null if you prefer
              });
              
              setUnreadMessages(unreadData.unreadCounts);
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
          return { ...prev, [data.senderId]: { count: 0, message: data.message } }; // Reset unread count when chat is opened
        }
  
        return {
          ...prev,
          [data.senderId]: {
            count: (prev[data.senderId]?.count || 0) + 1,
            message: decryptedMessage, // Store the latest message as a snippet
          },
        };
      });

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
              message: data.message
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

  // return (
  //   <aside className="bg-white shadow-md p-4 rounded-md h-[calc(100vh-120px)] overflow-y-auto">
  //     <h2 className="text-lg font-semibold mb-4">Friends</h2>
  //     <ScrollArea className="w-full max-h-120 overflow-y-auto">
  //       <div className="flex flex-col space-y-2">
  //         {friends.length > 0 ? (
  //           friends.map((user, index) => (
  //             <div key={`${index}`} className="bg-gray-100 mt-6 rounded-md shadow-md">
  //               <div 
  //                 key={user.id || `${user.username}-${index}`}
  //                 className="relative flex items-center justify-between p-2 rounded-md"
  //               >
  //                 {/* Only render Badge if unread count is greater than 0 */}
  //                 {unreadMessages != undefined && unreadMessages[user.username]?.count > 0 && (
  //                   <Badge variant="destructive" className="absolute top-0 right-0 -mr-0 ">
  //                     {unreadMessages[user.username].count}
  //                   </Badge>
  //                 )}

  //                 <Link href={`/profile/${encodeURIComponent(user.username)}`} className="flex items-center gap-x-3">
  //                   <div className="flex items-center space-x-2 transition-transform duration-200 hover:scale-105 active:scale-95">
  //                     <Image 
  //                       src={user.image} 
  //                       alt={user.username} 
  //                       width={40} 
  //                       height={40} 
  //                       className="rounded-full border"
  //                     />
  //                     <p className="text-sm font-medium">{user.username}</p>
  //                   </div>
  //                 </Link>

  //                 <div className="flex items-center gap-2">
  //                   <Button className="transition-transform duration-200 hover:scale-105 active:scale-95" onClick={() => openChat(user.username, currentUser)}>
  //                     Chat
  //                   </Button>
  //                 </div>
  //               </div>

  //               <div className="flex-1 ml-6 pb-2">
  //                 {/* Ensure unreadMessages is defined and check for the message */}
  //                 {unreadMessages != undefined && unreadMessages?.[user.username]?.message ? (
  //                   <span
  //                     className="text-xs text-gray-500"
  //                     onClick={() => openChat(user.username, currentUser)}
  //                   >
  //                     {unreadMessages[user.username].message.length > 30
  //                       ? unreadMessages[user.username].message.substring(0, 30) + "..."
  //                       : unreadMessages[user.username].message}
  //                   </span>
  //                 ) : (
  //                   <span className="text-xs text-black-800">Chat with this person!</span> // Default text when no unread message
  //                 )}
  //               </div>
  //             </div>
  //           ))
  //         ) : (
  //           <p className="text-gray-500">No friends found</p>
  //         )}
  //       </div>
  //     </ScrollArea>
  //   </aside>
  // );
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
            <GroupChatsList/>
          </ScrollArea>
          
        </TabsContent>
      </Tabs>
    </aside>
  );
}