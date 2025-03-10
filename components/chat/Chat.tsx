"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useSocket } from "@/components/provider/SocketProvider";
import { useEffect, useRef, useState } from "react";
import ChatList from "./ChatList";
import { Toaster, toast } from "sonner";
import Sidebar from "@/components/custom-ui/Sidebar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import ChatMessage from "./ChatMessage";
import { Video } from 'lucide-react';

import { Message } from "@/types/message";
import { User } from "@/types/user";

export default function Chat() {
  const socket = useSocket();
  const searchParams = useSearchParams();
  const router = useRouter();
  const friendUsername = searchParams.get("friend");
  const currentUsername = searchParams.get("user");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [friendUser, setFriendUser] = useState<User | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUsername || !friendUsername) return;

    async function fetchPreviousMessages() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/getmessages?sender=${currentUsername}&receiver=${friendUsername}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch messages");
        }

        setMessages(
          data.messages.map((msg: Message) => ({
            sender: msg.sender,
            message: msg.message,
            date: formatTimestamp(msg.date),
          }))
        );

        const [senderResponse, friendResponse] = await Promise.all([
          fetch(`/api/getsingleuser?username=${currentUsername}`),
          fetch(`/api/getsingleuser?username=${friendUsername}`)
        ]);

        const senderData = await senderResponse.json();
        const friendData = await friendResponse.json();
        
        setCurrentUser(senderData.data);
        setFriendUser(friendData.data);

      } catch (error: unknown) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("An unexpected error occurred. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchPreviousMessages();
  }, [currentUsername, friendUsername, router]);


  useEffect(() => {
    if (!socket || !friendUsername) return;
  
    socket.emit("register", currentUsername);
  
    socket.on("privateMessage", ({ senderId, message }) => {
      if (senderId === friendUsername) {
        setMessages((prev) => [
          ...prev,
          { sender: senderId, message, date: formatTimestamp(new Date().toISOString()) }, // Format timestamp
        ]);
      }
    });
  
    return () => {
      socket.off("privateMessage");
    };
  }, [socket, currentUsername, friendUsername]);
  

  const sendMessage = async () => {
    if (socket && input.trim() && friendUsername && currentUsername) {
      try {
        const response = await fetch("/api/postmessage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderUsername: currentUsername,
            receiverUsername: friendUsername,
            message: input,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          toast.error(`Error storing message: ${data.message}`);
          return;
        }
      } catch (error) {
        toast.error("Error storing message.");
        console.error("Error storing message:", error);
      }

      try {
        await fetch("/api/postunreadmessage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: currentUsername,
            receiver: friendUsername,
            count: 1, // Increment unread count in Firestore if offline
          }),
        });
      } catch (error) {
        console.error("Error storing unread message:", error);
      }

      socket.emit("privateMessage", {
        senderId: currentUsername,
        receiverId: friendUsername,
        message: input,
      });

      setMessages((prev) => [...prev, { sender: currentUsername, message: input, date: formatTimestamp(new Date().toISOString()) }]);
      setInput("");
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [isLoading, messages.length]); // Trigger when loading is complete

  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleRedirectToHome = () => {
    setErrorMessage(null);
    router.push("/");
  };

  function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: true,
    });
  }

  return (
    <div className="grid grid-cols-[300px_2fr_300px] gap-6 p-6 w-full h-screen overflow-hidden">
      <Sidebar />
      <section className="relative flex flex-col space-y-6 h-full bg-white shadow-md rounded-lg p-4 overflow-hidden">
        <h1 className="text-lg font-semibold">Chat with {friendUsername}</h1>
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto w-full space-y-5 pr-2 pb-20 p-4 rounded-lg">
          {isLoading ? (
          [...Array(8)].map((_, index) => (
            <div key={index} className={`flex items-start space-x-4 ${index % 2 === 0 ? "justify-start" : "justify-end"}`}>
              <Skeleton className="w-10 h-10 rounded-full" /> {/* Avatar Skeleton */}
              <div className="flex flex-col space-y-2">
                <Skeleton className="h-4 w-24 rounded-md" /> {/* Username & Time Skeleton */}
                <Skeleton className="h-12 w-40 rounded-md" /> {/* Message Skeleton */}
              </div>
            </div>
          ))
          ) : (
            messages.map((msg, index) => {
              const isCurrentUser = msg.sender === currentUsername;
              const user = isCurrentUser ? currentUser : friendUser;

              return <ChatMessage key={index} message={msg} isCurrentUser={isCurrentUser} user={user} />;
            })
          )}
          <div ref={messagesEndRef} className="pb-2" />
        </div>
        <div className="absolute bottom-0 left-0 w-full p-4 bg-white shadow-md flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 p-2 border rounded-lg w-full"
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Send
          </button>
          <button
            onClick={() => {router.push(`/channel?friend=${friendUsername}&user=${currentUsername}`)}}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            <Video/>
          </button>
        </div>
      </section>
      <ChatList />
      
      {errorMessage && (
        <Dialog open={true}>
          <DialogContent forceMount className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Error</DialogTitle>
            </DialogHeader>
            <p>{errorMessage}</p>
            <DialogFooter>
              <Button onClick={handleRedirectToHome}>Continue</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>      
      )}
      <Toaster position="bottom-center" richColors />
    </div>
  );
}