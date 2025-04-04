"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const isDev = process.env.NODE_ENV !== "production";
const socketUrl = isDev 
  ? "ws://linknest.live" 
  : "wss://linknest.live";

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);

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

    // socketInstance.on("privateMessage", (data) => {
    //   console.log("Received privateMessage:", data); // Log received message
    // });

    // socketInstance.on("groupMessage", (data) => {
    //     console.log("Received group Message:", data); 
    // });

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