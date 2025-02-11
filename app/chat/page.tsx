"use client";

import { SocketProvider } from "@/components/SocketProvider";
import Chat from "@/components/Chat"; // Your chat UI

export default function ChatPage() {
  return (
    <SocketProvider>
      <Chat />
    </SocketProvider>
  );
}