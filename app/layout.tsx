import type { Metadata } from "next";
import "./globals.css";
<<<<<<< HEAD
import { SocketProvider } from "@/components/SocketProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
=======
import Navbar from "../components/Navbar";
import { auth } from "@/auth";
import { SessionProvider } from "next-auth/react";
>>>>>>> c7362acb7933d002a237a0b956d2a868d383ca6f

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
<<<<<<< HEAD
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SocketProvider>
          {children}
        </SocketProvider>
        
=======
     <body className="bg-gray-100 text-gray-900 antialiased">
      <SessionProvider session={session}>
        <Navbar />
        <main className="flex min-h-screen">{children}</main>
        </SessionProvider>
>>>>>>> c7362acb7933d002a237a0b956d2a868d383ca6f
      </body>
    </html>
  );
}
