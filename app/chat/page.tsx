"use client";

import { SocketProvider } from "@/components/SocketProvider";
import Chat from "@/components/Chat";

export default function ChatPage() {
  return (
    <SocketProvider>
      <Chat />
    </SocketProvider>
  );
}