"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useSocket } from "@/components/provider/SocketProvider";
import { useEffect, useRef, useState } from "react";
import ChatList from "./ChatList";
import { Toaster, toast } from "sonner";
import Sidebar from "@/components/custom-ui/Sidebar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Video } from 'lucide-react';

interface Message {
  sender: string;
  message: string;
}

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

  const [first, second] = [currentUsername, friendUsername].sort();
  const channelName = `${first}_${second}`;

  useEffect(() => {
    if (!currentUsername || !friendUsername) return;

    async function fetchPreviousMessages() {
      try {
        const response = await fetch(`/api/getmessages?sender=${currentUsername}&receiver=${friendUsername}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to fetch messages");
        }

        setMessages(
          data.messages.map((msg: Message) => ({
            sender: msg.sender,
            message: msg.message,
          }))
        );
      } catch (error: unknown) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("An unexpected error occurred. Please try again.");
        }
      }
    }

    fetchPreviousMessages();
  }, [currentUsername, friendUsername, router]);

  useEffect(() => {
    if (!socket || !friendUsername) return;

    socket.emit("register", currentUsername);

    socket.on("privateMessage", ({ senderId, message }) => {
      if (senderId === friendUsername) {
        setMessages((prev) => [...prev, { sender: senderId, message }]);
      }
    });

    return () => {
      socket.off("privateMessage");
    };
  }, [socket, currentUsername, friendUsername]);

  const sendMessage = async () => {
    if (socket && input.trim() && friendUsername && currentUsername) {
      socket.emit("privateMessage", {
        senderId: currentUsername,
        receiverId: friendUsername,
        message: input,
      });

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

      setMessages((prev) => [...prev, { sender: currentUsername, message: input }]);
      setInput("");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleRedirectToHome = () => {
    setErrorMessage(null);
    router.push("/home");
  };

  return (
    <div className="grid grid-cols-[300px_2fr_300px] gap-6 p-6 w-full h-screen overflow-hidden">
      <Sidebar />
      <section className="relative flex flex-col space-y-6 h-full bg-white shadow-md rounded-lg p-4 overflow-hidden">
        <h1 className="text-lg font-semibold">Chat with {friendUsername}</h1>
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto w-full space-y-2 pr-2 pb-20"
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-2 rounded-lg max-w-[75%] break-words w-fit ${
                msg.sender === currentUsername
                  ? "bg-blue-500 text-white ml-auto"
                  : "bg-gray-300 text-black mr-auto"
              }`}
            >
              <strong>{msg.sender}:</strong> {msg.message}
            </div>
          ))}
          <div ref={messagesEndRef} className="pb-10" />
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
            onClick={() => {router.push(`/channel/${channelName}`)}}
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