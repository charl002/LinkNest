import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/custom-ui/Navbar";
import { auth } from "@/lib/auth";
import { SessionProvider } from "next-auth/react";
import { SocketProvider } from "@/components/provider/SocketProvider";
import { FriendsProvider } from "@/components/provider/FriendsProvider";
import { Toaster } from "sonner";
import { GroupChatsProvider } from "@/components/provider/GroupChatsProvider";

export const metadata: Metadata = {
  title: "LinkNest",
  description: "LinkNest is a website where you can connect with others by chatting, sharing posts and videocalling!",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  return (
    <html lang="en">
     <body className="bg-gray-100 text-gray-900 antialiased">
      <SessionProvider session={session}>
        <SocketProvider>
          <FriendsProvider>
            <GroupChatsProvider>
              <Navbar />
              <main className="flex min-h-screen">{children}</main>
            </GroupChatsProvider>
          </FriendsProvider>
        </SocketProvider>
      </SessionProvider>
      <Toaster position="bottom-center" richColors></Toaster>
      </body>
    </html>
  );
}