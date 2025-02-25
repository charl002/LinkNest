"use client";

import { useSearchParams } from "next/navigation";
import { useSocket } from "@/components/SocketProvider";
import { useEffect, useState } from "react";

export default function Chat() {
  const socket = useSocket();
  const searchParams = useSearchParams();
  const friendUsername = searchParams.get("friend");
  const currentUsername = searchParams.get("user");

  const [messages, setMessages] = useState<{ sender: string; message: string }[]>([]);
  const [input, setInput] = useState("");

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

  const sendMessage = () => {
    if (socket && input.trim() && friendUsername && currentUsername) {
      socket.emit("privateMessage", {
        senderId: currentUsername,
        receiverId: friendUsername,
        message: input,
      });

      setMessages((prev) => [...prev, { sender: "You", message: input }]);
      setInput("");
    }
  };

  return (
    <div>
      <h1>Chat</h1>
      <div>
        {messages.map((msg, index) => (
          <p key={index}>
            <strong>{msg.sender}:</strong> {msg.message}
          </p>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}