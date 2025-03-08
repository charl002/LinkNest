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

const Navbar = () => {

  const [userName, setUserName] = useState("User");
  const [userImage, setUserImage] = useState("../../public/defaultProfilePic.jpg");
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
  
    return (
      <nav className="bg-white shadow-md py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          <Link href="/"><span className="text-black">Link</span><span className="text-blue-500">Nest</span></Link>
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
                  </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
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