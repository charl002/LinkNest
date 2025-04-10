"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useSocket } from "@/components/provider/SocketProvider";
import { useEffect, useRef, useState } from "react";
import ChatList from "./ChatList";
import { Toaster, toast } from "sonner";
import Sidebar from "@/components/custom-ui/Sidebar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import ChatMessage from "./ChatMessage";
import { Video } from "lucide-react";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@radix-ui/react-hover-card";
import type { Message } from "@/types/message";
import type { User } from "@/types/user";
import { emitPrivateMessage, postMessageAndUnread } from "@/utils/messageUtils";
import { decryptMessage } from "@/utils/decrypt";
import { GroupChat } from "@/types/group";
import { Avatar, AvatarImage } from "@radix-ui/react-avatar";
import { AvatarFallback } from "../ui/avatar";
import { useGroupChats } from "../provider/GroupChatsProvider";

export default function Chat() {
  const socket = useSocket();
  const searchParams = useSearchParams();
  const router = useRouter();
  const friendUsername = searchParams.get("friend");
  const currentUsername = searchParams.get("user");
  const groupchatId = searchParams.get("group");
  const { groupChats } = useGroupChats();

  const [group, setGroup] = useState<GroupChat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [otherUsers, setOtherUsers] = useState<User[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [showSidebar, setShowSidebar] = useState(false);
  const [showChatList, setShowChatList] = useState(false);

  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);

  // Function to scroll to bottom of messages
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      // Only scroll the message container, not the page
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (!currentUsername || !friendUsername) return;

    async function fetchPreviousMessages() {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/getmessages?sender=${currentUsername}&receiver=${friendUsername}`
        );
        const data = await response.json();

        // console.log("messages", data);
    
        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch messages");
        }
    
        setMessages(
          data.messages.map((msg: Message) => ({
            id: msg.id,
            sender: msg.sender,
            message: decryptMessage(msg.message), // Decrypt the message
            date: formatTimestamp(msg.date),
            isCallMsg: msg.isCallMsg,
            reactions: msg.reactions || [],
            replyTo: msg.replyTo ?? undefined
          }))
        );
    
        const [senderResponse, friendResponse] = await Promise.all([
          fetch(`/api/getsingleuser?username=${currentUsername}`),
          fetch(`/api/getsingleuser?username=${friendUsername}`),
        ]);
    
        const senderData = await senderResponse.json();
        const friendData = await friendResponse.json();
    
        setCurrentUser(senderData.data);
        setOtherUsers([friendData.data]);
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
    if(!groupchatId || !currentUsername) return;

    async function fetchGroupMessages() {
      if (!groupchatId || !currentUsername || !groupChats || groupChats.length === 0) return;
  
      try {
        setIsLoading(true);

        const groupData = groupChats.find((group) => group.id === groupchatId);
        if (!groupData) {
          throw new Error("Group not found");
        }

        console.log(groupchatId);

        setGroup(groupData);

        const response = await fetch(`/api/getmessages?groupId=${groupchatId}&sender=${currentUsername}`);
        const data = await response.json();

        console.log(data);
        
        if (!response.ok) throw new Error(data.message || "Failed to fetch messages");

        setMessages(
          data.messages.map((msg: Message) => ({
            id: msg.id,
            sender: msg.sender,
            message: decryptMessage(msg.message),
            date: formatTimestamp(msg.date),
            isCallMsg: msg.isCallMsg,
            reactions: msg.reactions || [],
            groupId: msg.groupId
          }))
        );

        const fetchUsers = async () => {
          const members = groupData.members.filter(
            (member): member is string => member !== null,
          )
    
          const fetchedUsers = await Promise.all(
            members.map(async (value) => {
              const userResponse = await fetch(`/api/getsingleuser?username=${value}`)
              const userData = await userResponse.json()
              return userData.data as User
            }),
          )

          const currentUserData = fetchedUsers.find((user: User) => user.username === currentUsername) || null;
          const otherUsersData = fetchedUsers.filter((user: User) => user.username !== currentUsername);

          setCurrentUser(currentUserData);
          setOtherUsers(otherUsersData);
        }
    
        fetchUsers()

      } catch (error: unknown) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("An unexpected error occurred. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupMessages();
  }, [currentUsername, groupChats, groupchatId])

  // This useEffect listens for messages on the Socket IO
  useEffect(() => {
    console.log("test", socket);
    if (!socket) return;

    socket.emit("register", currentUsername);
    
    socket.on("groupMessage", ({ senderId, message, msgId, isCallMsg, groupId }) => {
      
      console.log("gC", message);

      if (groupId === groupchatId) {

        setMessages((prev) => [
          ...prev,
          {
            id: msgId,
            sender: senderId,
            message: decryptMessage(message),
            date: formatTimestamp(new Date().toISOString()),
            isCallMsg,
            reactions: [],
            groupId,
          },
        ]);
      }
    });

    socket.on("privateMessage", ({ senderId, message, msgId, isCallMsg, replyTo }) => {
      
      if (senderId === friendUsername) {
        setMessages((prev) => [
          ...prev,
          {
            id: msgId,
            sender: senderId,
            message: decryptMessage(message),
            date: formatTimestamp(new Date().toISOString()),
            isCallMsg: isCallMsg,
            reactions: [],
            replyTo: replyTo ?? undefined,
          }, // Format timestamp
        ]);
      }
    });

    return () => {
      socket.off("privateMessage");
      // socket.off("groupMessage");
    };
  }, [socket, currentUsername, friendUsername, groupchatId]);

  const sendMessage = async () => {
    if (socket && input.trim() && currentUsername) {
      try {
        // If there's a single friend, send a private message
        if (friendUsername) {

          const replyData = replyToMessage
        ? {
            id: replyToMessage.id,
            sender: replyToMessage.sender,
            message: replyToMessage.message,
          }
        : undefined;

          const postMessageData = await postMessageAndUnread(
            currentUsername,
            input,
            false,
            friendUsername,   // Send to a single friend
            undefined,          // No groupId for private messages
            undefined,           // No receivers for private messages
            replyData
          );

          emitPrivateMessage(
            socket,
            currentUsername,
            input,
            postMessageData.docId,
            false, // Not a call message
            friendUsername,
            undefined,
            undefined,
            replyData
          );

          // Update the UI with the new message
          setMessages((prev) => [
            ...prev,
            {
              id: postMessageData.id,
              sender: currentUsername,
              message: input,
              date: formatTimestamp(new Date().toISOString()),
              isCallMsg: false,
              replyTo: replyData
            },
          ]);
        } 
        // If it's a group chat, send a message to all group members
        else if (groupchatId && group?.members) {
          const validMembers = group.members.filter((member) => member !== null && member != currentUsername) as string[]; // Filter out nulls

          const replyData = replyToMessage
        ? {
            id: replyToMessage.id,
            sender: replyToMessage.sender,
            message: replyToMessage.message,
          }
        : undefined;

          const postMessageData = await postMessageAndUnread(
            currentUsername,
            input,
            false,
            undefined,          // No single receiver for group chat
            groupchatId,        // Group ID
            validMembers,      // Send to all group members
            replyData
          );

          emitPrivateMessage(
            socket,
            currentUsername,
            input,
            postMessageData.id,
            false, // Not a call message
            undefined,
            groupchatId,
            validMembers,
            replyData
          );

          // Update the UI with the new message
          setMessages((prev) => [
            ...prev,
            {
              id: postMessageData.id,
              sender: currentUsername,
              message: input,
              date: formatTimestamp(new Date().toISOString()),
              isCallMsg: false,
              replyTo: replyData ?? undefined
            },
          ]);
        }
      } catch (error) {
        toast.error("Error storing message.");
        console.error("Error storing message:", error);
      }
  
      // Clear the input field after sending the message
      setInput("");
      setReplyToMessage(null);
    }
  };  

  // Scroll to bottom when messages change
  useEffect(() => {
    // Wait for the DOM to update
    setTimeout(scrollToBottom, 100);
  }, [messages]);

  // Scroll to bottom when loading completes
  useEffect(() => {
    if (!isLoading) {
      setTimeout(scrollToBottom, 100);
    }
  }, [isLoading]);

  // Initial scroll when component mounts
  useEffect(() => {
    setTimeout(scrollToBottom, 300);
  }, []);

  // Redirects home
  const handleRedirectToHome = () => {
    setErrorMessage(null);
    router.push("/");
  };

  //Handles the logic of entering a VideoCall with a friend
  const handleRedirectToCall = async () => {
    if (!currentUsername || !friendUsername) return;

    const callMessage = "📞 I entered the call! Join Up!";
    const isCallMsg = true;

    try {
      // Post call message and unread count, and emit socket message
      const postMessageData = await postMessageAndUnread(
        currentUsername,
        friendUsername,
        true,
        callMessage,
      );

      if(socket){
        emitPrivateMessage(
          socket,
          currentUsername,
          callMessage,
          postMessageData.id,
          true,
          friendUsername
        );

        socket.emit("call", {
          senderId: currentUsername,
          receiverId: friendUsername,
        });
      }
      
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
  
      router.push(`/channel?friend=${encodeURIComponent(friendUsername)}&user=${encodeURIComponent(currentUsername)}`);
    } catch (error) {
      console.error("Error starting the call:", error);
      toast.error("Error starting the call.");
    }
  };

  const handleDeleteMessage = async (message: Message) => {
    const messageId = typeof message.id === "string" ? message.id : String(message.id);
    const username = currentUsername;
    try {
      const response = await fetch("/api/deletemessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId, username
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        toast.error(data.message || "Failed to delete message");
        return;
      }
  
      setMessages((prev) => prev.filter((msg) => msg.id !== message.id));
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("An error occurred while deleting the message");
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

      const updatedMessageRes = await fetch(
        `/api/getmessage?messageId=${message.id}`
      );
      const updatedMessageData = await updatedMessageRes.json();

      if (!updatedMessageRes.ok) {
        toast.error("Failed to fetch updated message");
        return;
      }

      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === message.id
            ? { ...msg, reactions: updatedMessageData.reactions }
            : msg
        )
      );

    } catch (error) {
      console.error("Error updating reaction:", error);
      toast.error("An error occurred.");
    }
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text)
    .then(() => toast.success("Copied to clipboard!"))
    .catch(() => toast.error("Failed to copy message."));
  }

  const handleRemoveReaction = async (message: Message) => {
    try {
      const response = await fetch("/api/deletereaction", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: message.id,
          user: currentUsername,
        }),
      });

      if (!response.ok) {
        toast.error("Failed to remove reaction");
        return;
      }
      const updatedMessageRes = await fetch(
        `/api/getmessage?messageId=${message.id}`
      );
      const updatedMessageData = await updatedMessageRes.json();

      if (!updatedMessageRes.ok) {
        toast.error("Failed to fetch updated message");
        return;
      }

      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === message.id
            ? { ...msg, reactions: updatedMessageData.reactions }
            : msg
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
  const chatMainContent = (
    <section className="relative flex flex-col bg-white shadow-md rounded-lg overflow-hidden">
      <h1 className="text-lg font-semibold p-4">
        {groupchatId && group ? (
          <div className="flex items-center gap-2">
            <Avatar className="w-10 h-10 rounded-full">
              <AvatarImage 
                src={group?.image || "/defaultGroupPic.png"}
                alt={group?.name || "Group Chat"}
                className="w-full h-full object-cover rounded-full"
              />
              <AvatarFallback className="flex items-center justify-center w-full h-full bg-gray-300 text-white rounded-full">
                {group?.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {/* Show skeleton if group name is loading */}
            {group ? (
              <span>{group.name}</span>
            ) : (
              <Skeleton className="h-4 w-32 rounded-md" />
            )}
          </div>
        ) : friendUsername ? (
          `Chat with ${friendUsername}`
        ) : (
          <Skeleton className="h-4 w-32 rounded-md" />
        )}
      </h1>
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto min-h-[calc(100vh-250px)] max-h-[calc(100vh-250px)] w-full space-y-5 pr-2 p-4 rounded-lg"
        style={{ scrollbarWidth: "thin" }}
      >
        {isLoading
          ? [...Array(8)].map((_, index) => (
              <div
                key={index}
                className={`flex items-start space-x-4 ${
                  index % 2 === 0 ? "justify-start" : "justify-end"
                }`}
              >
                <Skeleton className="w-10 h-10 rounded-full" />{" "}
                {/* Avatar Skeleton */}
                <div className="flex flex-col space-y-2">
                  <Skeleton className="h-4 w-24 rounded-md" />{" "}
                  {/* Username & Time Skeleton */}
                  <Skeleton className="h-12 w-40 rounded-md" />{" "}
                  {/* Message Skeleton */}
                </div>
              </div>
            ))
          : messages.map((msg, index) => {
              const isCurrentUser = msg.sender === currentUsername;
              let user;
              if(isCurrentUser){
                user = currentUser;
              } else {
                user = otherUsers.find((user) => user.username === msg.sender) || null;
              }

  
              return (
                <div
                  key={index}
                  className={`relative flex ${
                    isCurrentUser ? "justify-end" : "justify-start"
                  } p-2`}
                >
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
                              <span key={idx} className="text-sm">
                                {reaction.reaction}
                              </span>
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
                                {reaction.user} reacted with{" "}
                                {reaction.reaction}
                              </p>
                            ))}
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    )}
                    {msg.isCallMsg ? (
                      <div className="relative">
                        <ChatMessage
                          message={msg}
                          isCurrentUser={isCurrentUser}
                          user={user}
                        />
                      </div>
                    ) : (
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="relative">
                          <ChatMessage
                            message={msg}
                            isCurrentUser={isCurrentUser}
                            user={user}
                          />
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent
                        side="top"
                        align="center"
                        sideOffset={5}
                        className="bg-white shadow-lg p-2 rounded-lg border border-gray-200"
                      >
                        <div className="flex flex-col space-y-2">
                          <button 
                          className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
                          onClick={() => setReplyToMessage(msg)}>
                            Reply
                          </button>
                          <button 
                          className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
                          onClick={() => handleCopyMessage(msg.message)}>
                            Copy
                          </button>
  
                          <HoverCard>
                            <HoverCardTrigger asChild>
                              <button className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200">
                                React
                              </button>
                            </HoverCardTrigger>
                            <HoverCardContent
                              side="right"
                              align="center"
                              sideOffset={5}
                              className="bg-white shadow-lg p-2 rounded-lg border border-gray-200"
                            >
                              <div className="flex space-x-2">
                                {["👍", "❤️", "😂", "👎", "😭"].map(
                                  (emoji) => (
                                    <button
                                      key={emoji}
                                      className="text-lg hover:scale-125"
                                      onClick={() =>
                                        handleAddReaction(msg, emoji)
                                      }
                                    >
                                      {emoji}
                                    </button>
                                  )
                                )}
                                {(msg.reactions ?? []).some(
                                  (reaction) =>
                                    reaction.user === currentUsername
                                ) && (
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
                          {isCurrentUser && (
                          <button 
                            className="px-3 py-1 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
                            onClick={() => handleDeleteMessage(msg)}>
                            Delete
                          </button>
                          )}
                        </div>
                      </HoverCardContent>
                    </HoverCard>)}
                  </div>
                </div>
              );
            })}
      </div>
      <div className="p-4 bg-white shadow-md mt-auto">
        <div className="flex flex-col space-y-2">
          {replyToMessage && (
            <div className="p-2 border-l-4 border-blue-500 bg-blue-50 rounded shadow-sm text-sm">
              <div className="flex justify-between items-center">
                <span className="text-blue-600 font-medium">Replying to {replyToMessage.sender}:</span>
                <button
                  className="text-red-500 text-xs ml-2 hover:underline"
                  onClick={() => setReplyToMessage(null)}
                >
                  Cancel
                </button>
              </div>
              <p className="truncate">{replyToMessage.message}</p>
            </div>
          )}
  
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 p-2 border rounded-lg w-full"
              placeholder="Type a message..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                  setTimeout(scrollToBottom, 100);
                }
              }}
            />
            <button
              onClick={() => {
                sendMessage();
                setTimeout(scrollToBottom, 100);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              Send
            </button>
            <button
              onClick={handleRedirectToCall}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              <Video />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
  
    return (
      <div className="bg-grey-100 min-h-screen w-full text-gray-800">
        {/* Mobile Toggle Buttons */}
        <div className="md:hidden flex justify-between p-4 gap-4">
          <button
            onClick={() => {
              setShowSidebar((prev) => !prev);
              setShowChatList(false);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-md w-1/2"
          >
            {showSidebar ? "Close Sidebar" : "Sidebar"}
          </button>
          <button
            onClick={() => {
              setShowChatList((prev) => !prev);
              setShowSidebar(false);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-md w-1/2"
          >
            {showChatList ? "Close Friends" : "Friends"}
          </button>
        </div>
  
        {/* Mobile View Content */}
        <div className="md:hidden min-h-screen overflow-y-auto px-4">
          {showSidebar && <Sidebar />}
          {showChatList && <ChatList />}
          {!showSidebar && !showChatList && chatMainContent}
        </div>
  
        {/* Desktop View */}
        <div className="hidden md:grid grid-cols-[300px_2fr_300px] gap-6 p-6 w-full h-[calc(100vh-40px)] overflow-hidden">
          <div className="h-full overflow-y-auto">
            <Sidebar />
          </div>
          <div className="h-full overflow-y-auto">
            {chatMainContent}
          </div>
          <div className="h-full overflow-y-auto">
            <ChatList />
          </div>
        </div>
  
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
  