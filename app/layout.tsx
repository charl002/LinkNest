import type { Metadata } from "next";
import "./globals.css";
import Navbar from "../components/Navbar";
import { auth } from "@/auth";
import { SessionProvider } from "next-auth/react";

export const metadata: Metadata = {
  title: "LinkNest",
  description: "All rights reserved to LinkedOut",
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
        <Navbar />
        <main className="flex min-h-screen">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
