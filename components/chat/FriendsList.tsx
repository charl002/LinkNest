import { User } from '@/types/user';
import { useRouter } from 'next/navigation';
import React from 'react';

interface FriendsListProps {
  unreadMessages: Record<string, { count: number; message: string }>;
  setUnreadMessages: React.Dispatch<React.SetStateAction<Record<string, { count: number; message: string }>>>;
  currentUser: string | null;
  router: ReturnType<typeof useRouter>;
  friends: User[];
}

const FriendsList = ({ unreadMessages, setUnreadMessages, currentUser, router, friends }: FriendsListProps) => {
  return (
    <div>FriendsList</div>
  )
}

export default FriendsList