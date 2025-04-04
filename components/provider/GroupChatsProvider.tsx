"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useSocket } from "./SocketProvider";
import { customToast } from "../ui/customToast";

import { GroupChat } from "@/types/group";

/**
 * The purpose of this file is to fetch once the groupchats, and populate the UI. Will need
 * to fix it by connecting websockets to this.
 */
interface GroupChatsContextType {
  groupChats: GroupChat[];
  setGroupChats: React.Dispatch<React.SetStateAction<GroupChat[]>>;
}

const GroupChatsContext = createContext<GroupChatsContextType | undefined>(undefined);

export function GroupChatsProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [groupChats, setGroupChats] = useState<GroupChat[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const socket = useSocket();

  // Fetch the username using the session email
  useEffect(() => {
    if (!session?.user?.email) return;

    async function fetchUsername() {
      try {
        const response = await fetch(`/api/getsingleuser?email=${session?.user?.email}`);
        const data = await response.json();

        if (response.ok && data?.data?.username) {
          setUsername(data.data.username);
        }
      } catch (error) {
        console.error("Error fetching username:", error);
      }
    }

    fetchUsername();
  }, [session]);

  useEffect(() => {
    if (!socket || !session?.user?.email || !username) return;

    const fetchGroupChats = async () => {
      try {
        const response = await fetch(`/api/getgroupchats?user=${username}`);
        const data = await response.json();

        if (!response.ok) {
          console.error("Error fetching group chats:", data);
          return;
        }

        console.log("Group Chat: ", data.groupChats);

        setGroupChats(data.groupChats);
      } catch (error) {
        console.error("Error fetching group chats:", error);
      }
    };

    // Fetch group chats initially
    fetchGroupChats();

    // Listen for group chat updates (e.g., a new group chat added)
    socket.on("updateGroupChatsList", () => fetchGroupChats());

    // Listen for events like group chat created or deleted
    socket.on("groupChatCreated", ({ groupName }) => {
      customToast({ message: `New group chat created: ${groupName}`, type: "success" });
    });

    socket.on("groupChatDeleted", ({ groupName }) => {
      customToast({ message: `Group chat deleted: ${groupName}`, type: "error" });
    });

    return () => {
      socket.off("updateGroupChatsList");
      socket.off("groupChatCreated");
      socket.off("groupChatDeleted");
    };
  }, [session?.user?.email, socket, username]);

  return (
    <GroupChatsContext.Provider value={{ groupChats, setGroupChats }}>
      {children}
    </GroupChatsContext.Provider>
  );
}

export function useGroupChats() {
  const context = useContext(GroupChatsContext);
  if (!context) {
    throw new Error("useGroupChats must be used within a GroupChatsProvider");
  }
  return context;
}
