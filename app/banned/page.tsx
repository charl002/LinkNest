"use client";

import { signOut } from "next-auth/react";
import { useEffect } from "react";

export default function BannedPage() {
  useEffect(() => {
    // Sign out the user when they reach this page
    signOut({ callbackUrl: "/" });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Account Banned</h1>
        <p className="text-gray-600 mb-4">
          Your account has been banned due to violation of our terms of service.
          Please contact support for more information.
        </p>
        <p className="text-sm text-gray-500">
          You will be automatically signed out.
        </p>
      </div>
    </div>
  );
}