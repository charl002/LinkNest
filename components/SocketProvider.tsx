"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const hostname = process.env.HOST || "localhost";
const port = Number(process.env.ENV) || 3000;
const protocol = process.env.PROTOCOL || "ws"

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Might break when on production
    const socketInstance: Socket = io(`${protocol}://${hostname}:${port}`, {
      transports: ["websocket", "polling"],
    });

    setSocket(socketInstance);

    socketInstance.on("connect", () => console.log("Connected to WebSocket!"));

    socketInstance.on("disconnect", () => console.log("Disconnected from WebSocket"));

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}