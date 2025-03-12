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
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@radix-ui/react-hover-card";
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
        console.log(data.messages)
        setMessages(
          data.messages.map((msg: Message) => ({
            id: msg.id,
            sender: msg.sender,
            message: msg.message,
            date: formatTimestamp(msg.date),
            reactions: msg.reactions || []
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
  
    socket.on("privateMessage", ({ senderId, message , msgId}) => {
      if (senderId === friendUsername) {
        setMessages((prev) => [
          ...prev,
          {id: msgId, sender: senderId, message, date: formatTimestamp(new Date().toISOString()), reactions: [] }, // Format timestamp
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

        socket.emit("privateMessage", { 
          senderId: currentUsername,
          receiverId: friendUsername,
          message: input,
          msgId: data.docId
        });
  
        setMessages((prev) => [...prev, { id: data.docId, sender: currentUsername, message: input, date: formatTimestamp(new Date().toISOString()) }]);
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

  const handleAddReaction = async (message: Message, reaction: string) => {
    try {
      const response = await fetch("/api/putreaction", {
        method: "PUT",
        body: JSON.stringify({
          messageId: message.id,
          user: currentUsername,
          emoji: reaction,
        }),
      });
      console.log(message.id)
      console.log(currentUsername)
      console.log(reaction)

      if (!response.ok) {
        toast.error("Failed to add reaction");
        console.error("Error adding reaction", response);

        return;
      }
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === message.id
            ? {
                ...msg,
                reactions: [
                  ...(Array.isArray(msg.reactions) ? msg.reactions : []),
                  { user: currentUsername || "Unknown", reaction },
                ],
              }
            : msg
        )
      );
      toast.success("Reaction added!");
    } catch (error) {
      console.error("Error adding reaction", error);
      toast.error("An error occured.");
    }
  }

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

              return (
                <div key={index} className={`relative flex ${isCurrentUser ? "justify-end" : "justify-start"} p-2`}>
                <div className="relative flex flex-col">
                  {msg.reactions && msg.reactions.length > 0 && (
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div
                          className={`absolute -top-8 ${
                            isCurrentUser ? "left+25" : "right-0"
                          } flex space-x-1 bg-white shadow-md rounded-full px-2 py-1 cursor-pointer border border-gray-300`}
                        >
                          {msg.reactions.map((reaction, idx) => (
                            <span key={idx} className="text-sm">{reaction.reaction}</span>
                          ))}
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent
                        side="top"
                        align="center"
                        sideOffset={5}
                        className="bg-white shadow-lg p-2 rounded-lg border border-gray-200"
                      >
                        <div className="flex flex-col space-y-1">
                          {msg.reactions.map((reaction, idx) => (
                            <p key={idx} className="text-xs text-gray-600">
                              {reaction.user} reacted with {reaction.reaction}
                            </p>
                          ))}
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  )}
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <div className="relative">
                        <ChatMessage message={msg} isCurrentUser={isCurrentUser} user={user} />
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent 
                      side="top" 
                      align="center" 
                      sideOffset={5} 
                      className="bg-white shadow-lg p-2 rounded-lg border border-gray-200"
                    >
                      <div className="flex flex-col space-y-2">
                        <button className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200">Reply</button>
                        <button className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200">Copy</button>
          
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <button className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200">React</button>
                          </HoverCardTrigger>
                          <HoverCardContent
                            side="right"
                            align="center"
                            sideOffset={5}
                            className="bg-white shadow-lg p-2 rounded-lg border border-gray-200"
                          >
                            <div className="flex space-x-2">
                              {["👍", "❤️", "😂", "👎", "😭"].map((emoji) => (
                                <button key={emoji} className="text-lg hover:scale-125" onClick={() => handleAddReaction(msg, emoji)}>
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </HoverCardContent>
                        </HoverCard>
          
                        <button className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600">Delete</button>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
          
                </div>
          
              </div>
            );
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