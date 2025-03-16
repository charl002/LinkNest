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
import { emitPrivateMessage, postMessageAndUnread } from "@/utils/messageUtils";

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
            isCallMsg: msg.isCallMsg,
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

  // This useEffect listens for messages on the Socket IO
  useEffect(() => {
    if (!socket || !friendUsername) return;
  
    socket.emit("register", currentUsername);
  
    socket.on("privateMessage", ({ senderId, message, msgId, isCallMsg}) => {
      if (senderId === friendUsername) {
        setMessages((prev) => [
          ...prev,
          { 
            id: msgId,
            sender: senderId, 
            message, 
            date: formatTimestamp(new Date().toISOString()),
            isCallMsg: isCallMsg,
            reactions: []
          }, // Format timestamp
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
        const postMessageData = await postMessageAndUnread(currentUsername, friendUsername, input, false);

        emitPrivateMessage(socket, currentUsername, friendUsername, input, postMessageData.docId, false);
  
        setMessages((prev) => [...prev, { 
          id: postMessageData, 
          sender: currentUsername, 
          message: input, 
          date: formatTimestamp(new Date().toISOString()),
          isCallMsg: false
        }]);
      } catch (error) {
        toast.error("Error storing message.");
        console.error("Error storing message:", error);
      }

      setInput("");
    }
  };

  // This makes sure that the page scrolls to the most recent message
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [isLoading, messages.length]); // Trigger when loading is complete

  // Scolls to the newest message when a new message is added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Redirects home
  const handleRedirectToHome = () => {
    setErrorMessage(null);
    router.push("/");
  };

  //Handles the logic of entering a VideoCall with a friend
  const handleRedirectToCall = async () => {
    if (!currentUsername || !friendUsername || !socket) return;

    const callMessage = "📞 I have started a call! Join Up!";
    const isCallMsg = true;
    
    try {
      // Post call message and unread count, and emit socket message
      const postMessageData = await postMessageAndUnread(currentUsername, friendUsername, callMessage, true);

      emitPrivateMessage(socket, currentUsername, friendUsername, callMessage, postMessageData.docId, true);

      socket.emit("call", { senderId: currentUsername, receiverId: friendUsername });

      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: postMessageData.docId,
          sender: currentUsername,
          message: callMessage,
          date: formatTimestamp(new Date().toISOString()),
          isCallMsg: isCallMsg,
        },
      ]);
  
      setInput(""); // Clear the input field
  
      router.push(`/channel?friend=${friendUsername}&user=${currentUsername}`);
    } catch (error) {
      console.error("Error starting the call:", error);
      toast.error("Error starting the call.");
    }
  };

  // Formating the timestamp so its human readable
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

      if (!response.ok) {
        toast.error("Failed to add reaction");
        console.error("Error adding reaction", response);

        return;
      }

      const updatedMessageRes = await fetch(`/api/getmessage?messageId=${message.id}`);
        const updatedMessageData = await updatedMessageRes.json();

        if (!updatedMessageRes.ok) {
            toast.error("Failed to fetch updated message");
            return;
        }

        setMessages((prevMessages) =>
            prevMessages.map((msg) =>
                msg.id === message.id ? { ...msg, reactions: updatedMessageData.reactions } : msg
            )
        );

        toast.success("Reaction updated!");
    } catch (error) {
        console.error("Error updating reaction:", error);
        toast.error("An error occurred.");
    }
  };

  const handleRemoveReaction = async (message: Message) => {
    try {
      const response = await fetch('/api/deletereaction', {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: message.id,
          user: currentUsername,
        }),
      });

      if (!response.ok){
        toast.error("Failed to remove reaction");
        return;
      }
      const updatedMessageRes = await fetch(`/api/getmessage?messageId=${message.id}`);
        const updatedMessageData = await updatedMessageRes.json();

        if (!updatedMessageRes.ok) {
            toast.error("Failed to fetch updated message");
            return;
        }

        setMessages((prevMessages) =>
            prevMessages.map((msg) =>
                msg.id === message.id ? { ...msg, reactions: updatedMessageData.reactions } : msg
            )
        );

        toast.success("Reaction removed!");
    } catch (error) {
        console.error("Error removing reaction:", error);
        toast.error("An error occurred.");
    }
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
                              {(msg.reactions ?? []).some((reaction) => reaction.user === currentUsername) && (
                                <button
                                    className="text-lg text-red-500 hover:scale-125"
                                    onClick={() => handleRemoveReaction(msg)}
                                >
                                    ❌
                                </button>
                            )}
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
            onClick={handleRedirectToCall}
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