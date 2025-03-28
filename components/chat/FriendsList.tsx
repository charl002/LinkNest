import { User } from '@/types/user';
import { useRouter } from 'next/navigation';
import React from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import Link from 'next/link';
import Image from 'next/image';

interface FriendsListProps {
  unreadMessages: Record<string, { count: number; message: string }>;
  setUnreadMessages: React.Dispatch<React.SetStateAction<Record<string, { count: number; message: string }>>>;
  currentUser: string | null;
  router: ReturnType<typeof useRouter>;
  friends: User[];
}

const FriendsList = ({ unreadMessages, setUnreadMessages, currentUser, router, friends }: FriendsListProps) => {
  const openChat = async (friendUsername: string, currentUsername: string | null) => {
    if (!currentUsername) return;
  
    // Reset unread messages immediately
    setUnreadMessages((prev) => ({
      ...prev,
      [friendUsername]: { count: 0, message: "" }, // Reset message snippet when chat is opened
    }));
  
    // Perform the fetch request asynchronously but navigate immediately
    router.push(`/chat?friend=${friendUsername}&user=${currentUsername}`);
  
    // Use async function for the fetch to run in parallel
    try {
      await fetch("/api/postunreadmessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: friendUsername,
          receiver: currentUsername,
          count: 0,
          message: "",
        }),
      });
    } catch (error) {
      console.error("Error resetting unread count:", error);
    }
  };


  return (
    <div className="flex flex-col space-y-2">
      {friends.length > 0 ? (
        friends.map((user, index) => (
          <div key={`${index}`} className="bg-gray-100 mt-6 rounded-md shadow-md">
            <div className="relative flex items-center justify-between p-2 rounded-md">
              {unreadMessages[user.username]?.count > 0 && (
                <Badge variant="destructive" className="absolute top-0 right-0 -mr-0">
                  {unreadMessages[user.username].count}
                </Badge>
              )}

              <Link href={`/profile/${encodeURIComponent(user.username)}`} className="flex items-center gap-x-3">
                <div className="flex items-center space-x-2 transition-transform duration-200 hover:scale-105 active:scale-95">
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
                <Button className="transition-transform duration-200 hover:scale-105 active:scale-95" onClick={() => openChat(user.username, currentUser)}>
                  Chat
                </Button>
              </div>
            </div>

            <div className="flex-1 ml-6 pb-2">
              {unreadMessages?.[user.username]?.message ? (
                <span className="text-xs text-gray-500" onClick={() => openChat(user.username, currentUser)}>
                  {unreadMessages[user.username].message.length > 30
                    ? unreadMessages[user.username].message.substring(0, 30) + "..."
                    : unreadMessages[user.username].message}
                </span>
              ) : (
                <span className="text-xs text-black-800">Chat with this person!</span>
              )}
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-500">No friends found</p>
      )}
    </div>
  );
}

export default FriendsList