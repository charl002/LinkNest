"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

// Will need to fix this logic later, this works for now on prod.
const isDev = process.env.NODE_ENV !== "production";
const socketUrl = isDev 
  ? "ws://localhost:3000" 
  : "wss://linknest-fkd5eba5dqbrhzd7.canadacentral-01.azurewebsites.net";

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);

  // Create the Socket object.
  useEffect(() => {
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

    return () => {
      socketInstance.disconnect();
      console.log("Socket disconnected");
    };
  }, []);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

// Allow 1 instance of 'socket' to be used.
export function useSocket() {
  return useContext(SocketContext);
}