"use client";

import { useEffect, useState } from "react";
import { doLogout } from "@/app/actions"
import { useSession } from "next-auth/react";
import Image from "next/image";
import LoginForm from "@/components/auth/LoginForm";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { House, AlignJustify } from 'lucide-react';
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,} from "@/components/ui/alert-dialog"
import { customToast } from "@/components/ui/customToast";

const Navbar = () => {

  const [userName, setUserName] = useState("User");
  const [userImage, setUserImage] = useState("/defaultProfilePic.jpg");
  const { data: session } = useSession();

  const email = session?.user?.email ?? "";
  const name = session?.user?.name ?? "User";

  useEffect(() => {
    const fetchSession = async () => {

      if (email) {
        try {
          const res = await fetch(`/api/getsingleuser?email=${encodeURIComponent(email)}`);
          if (res.ok) {
            const userData = await res.json();
            setUserName(userData.data.username);
            setUserImage(userData.data.image);
          }
        } catch (error) {
          console.error("Error fetching username:", error);
        }
      }
    };

    fetchSession();
  }, [email]);

  const handleDelete = async () => {
      try {
        const response = await fetch("/api/deleteaccount", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: userName }),
        });
  
        if (!response.ok) {
          throw new Error("Failed to delete account");
        }
        
        const data = await response.json();
        console.log(data.message);
        customToast({ message: `Account has been deleted`, type: "success" });
        
      } catch (error) {
        console.error("Error deleting Account:", error);
        customToast({ message: "An unexpected error occurred. Please try again.", type: "error" });
      }
      finally{
        doLogout();
      }
    };
  
    return (
      <nav className="bg-white shadow-md py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          <Link href="/" className="flex items-center">
            <span className="text-black">Link</span>
            <span className="text-blue-500">Nest</span> 
            <span className="ml-2 transition-transform duration-200 hover:scale-110 active:scale-90"><House/></span>
          </Link>
        </h1>
        
        <div className="flex items-center space-x-3">
          {session?.user ? (
            // If user is logged in, show profile image, username & logout button
            <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                  <div className="flex items-center space-x-3 cursor-pointer">
                    <Image
                      src={userImage}
                      alt="User Profile"
                      width={40}
                      height={40}
                      priority
                      className="rounded-full border border-gray-300"
                    />
                    <div className="flex flex-col">
                      <p className="text-gray-700 font-medium">{name}</p>
                      <p className="text-gray-500 text-sm">@{userName}</p>
                    </div>
                    <AlignJustify className="mb-3 transition-transform duration-200 hover:scale-110 active:scale-90" />
                  </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <Link href={`/profile/${encodeURIComponent(userName)}`}>
                        <DropdownMenuItem>
                          Profile
                        </DropdownMenuItem>
                      </Link>
                      <Link href="/createpost">
                        <DropdownMenuItem>
                          Create Post
                        </DropdownMenuItem>
                      </Link>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <form action={doLogout}>
                      <DropdownMenuItem>
                        <button type="submit" className="w-full text-left">
                          Log out
                        </button>
                      </DropdownMenuItem>
                    </form>
                    <DropdownMenuSeparator />
                    <form>
                      <DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button onClick={(e) => e.stopPropagation()} className="w-full text-left bg-red-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-red-700 transition duration-200 shadow-md">
                              Delete Account
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your account and all its content from our servers.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuItem>
                    </form>
                  </DropdownMenuContent>
                </DropdownMenu>
            </>
          ) : (
            // If no user, show login button
            <LoginForm/>
          )}
        </div>
      </nav>
    );
  };

  export default Navbar;