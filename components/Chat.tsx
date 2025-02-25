"use client";

import { useSearchParams } from "next/navigation";
import { useSocket } from "@/components/SocketProvider";
import { useEffect, useRef, useState } from "react";
import ChatList from "./ChatList";
import { Toaster } from "sonner";
import Sidebar from "./Sidebar";

export default function Chat() {
  const socket = useSocket();
  const searchParams = useSearchParams();
  const friendUsername = searchParams.get("friend");
  const currentUsername = searchParams.get("user");

  const [messages, setMessages] = useState<{ sender: string; message: string }[]>([]);
  const [input, setInput] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);


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

      try{
        const response = await fetch("/api/postmessage", {
          method: "POST",
          headers: { "Content-Type": "application/json"},
          body: JSON.stringify({
            senderUsername: currentUsername,
            receiverUsername: friendUsername,
            message: input,
          }),
        });

      const data = await response.json();
      if (!response.ok) {
        console.error("Error storing message:", data.message);
      }
      } catch (error) {
        console.error("Error storing message:", error);
      }

      setMessages((prev) => [...prev, { sender: "You", message: input }]);
      setInput("");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
                msg.sender === "You"
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
        </div>
      </section>
      <ChatList />
      <Toaster position="bottom-center" richColors />
    </div>
  );
}