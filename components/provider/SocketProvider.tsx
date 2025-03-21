"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const isDev = process.env.NODE_ENV !== "production";
const socketUrl = isDev 
  ? "ws://localhost:3000" 
  : "wss://linknest-fkd5eba5dqbrhzd7.canadacentral-01.azurewebsites.net";

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Might break when on production
    const socketInstance: Socket = io(socketUrl, {
      transports: ["websocket", "polling"],
    });
    
    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      console.log("Connected to WebSocket with socket ID:", socketInstance.id); // Log socket ID
    });

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from WebSocket");
    });

    socketInstance.on("privateMessage", (data) => {
      console.log("Received privateMessage:", data); // Log received message
    });

    socketInstance.on('newFriendRequest', (data) => {
      console.log("Received newFriendRequest:", data);
    });

    socketInstance.on('call', (data) => {
      console.log("Received Call:", data);
    });

    socketInstance.on('callUser', (data) => {
      console.log("Received Call User:", data);
    });

    return () => {
      socketInstance.disconnect();
      console.log("Socket disconnected");
    };
  }, []);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}