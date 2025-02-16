import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";

export const metadata: Metadata = {
  title: "LinkNest",
  description: "LinkNest is a website where you can connect with others by chatting, sharing posts and videocalling!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
     <body className="bg-gray-100 text-gray-900 antialiased">
        <Navbar />
        <main className="flex min-h-screen">{children}</main>
      </body>
    </html>
  );
}
