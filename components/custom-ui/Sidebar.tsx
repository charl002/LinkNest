"use client";

import { Button } from "../ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { customToast } from "../ui/customToast";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSocket } from "@/components/provider/SocketProvider";
import { useFriends } from "../provider/FriendsProvider";
import { X } from "lucide-react";
import Link from "next/link";

import { User } from "@/types/user";

export default function Sidebar() {
  const socket = useSocket();
  const { data: session } = useSession();
  const [friendName, setFriendName] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const currentUser = users.find((user) => user.email === session?.user?.email);
  const senderUsername = currentUser?.username || null;

  const { setFriends } = useFriends();

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch("/api/getalluser");
        const data = await response.json();

        if (data && Array.isArray(data.users)) {
          setUsers(data.users as User[]);
        } else {
          console.error("Unexpected API response:", data);
          setUsers([]);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        setUsers([]);
      }
    }
    fetchUsers();
  }, []);

  useEffect(() => {
    if (friendName.trim() === "") {
      setFilteredUsers([]);
    } else {
      setFilteredUsers(
        users.filter(
          (user) =>
            user.username &&
            user.username.toLowerCase().includes(friendName.toLowerCase())
        )
      );
    }
  }, [friendName, users]);

  useEffect(() => {
    if (socket) {
      console.log("Registering user to WebSocket:", senderUsername);
      socket.emit("register", senderUsername);

      // Not Working, will fix later.
      socket.on("call", async ({ message }) => {
        customToast({ message: message, type: "info", duration: 60000 });
      });

      //Listens to socket events of a new friend request
      socket.on("newFriendRequest", async ({ senderUsername }) => {
        console.log("Received new friend request:", senderUsername);

        if (!senderUsername) return;

        try {
          const response = await fetch(
            `/api/getuserbyusername?username=${senderUsername}`
          );
          const userData = await response.json();

          if (!response.ok) {
            console.error(
              `Error fetching user details for ${senderUsername}:`,
              userData
            );
            return;
          }

          setPendingRequests((prev) => {
            if (prev.some((user) => user.username === senderUsername))
              return prev;

            return [
              ...prev,
              {
                id: userData.id,
                username: senderUsername,
                image: userData.data.image || "/default-avatar.png",
                email: userData.data.email || "",
                name: userData.data.name || "",
                background: userData.data.background || "", // Provide default
                description: userData.data.description || "", // Provide default
              },
            ];
          });

          customToast({
            message: `New friend request from ${senderUsername}!`,
            type: "info",
          });
        } catch (error) {
          console.error("Error fetching user details:", error);
        }
      });

      return () => {
        socket.off("newFriendRequest");
        socket.off("call");
      };
    }
  }, [socket, senderUsername]);

  useEffect(() => {
    if (!currentUser) return;

    const fetchPendingRequests = async () => {
      try {
        const response = await fetch(
          `/api/getpendingrequests?username=${senderUsername}`
        );
        const data = await response.json();

        if (data?.pendingRequests?.length > 0) {
          const userRequests = await Promise.all(
            data.pendingRequests.map(async (username: string) => {
              const userResponse = await fetch(`/api/getsingleuser?username=${username}`);
              const userData = await userResponse.json();
              return userResponse.ok
                ? { id: userData.id, ...userData.data }
                : null;
            })
          );
          setPendingRequests(userRequests.filter(Boolean));
        } else {
          setPendingRequests([]);
        }
      } catch (error) {
        console.error("Error fetching pending requests:", error);
        setPendingRequests([]);
      }
    };

    fetchPendingRequests();
  }, [currentUser, senderUsername]);

  const handleAddFriend = async () => {
    if (!session?.user?.name || !friendName) {
      customToast({ message: `Error! Missing username`, type: "error" });
      return;
    } else if (senderUsername === friendName) {
      customToast({ message: "You can't add yourself!", type: "info" });
      return;
    }

    setIsLoading(true);

    const requestBody = {
      senderUsername: senderUsername,
      receiverUsername: friendName,
    };

    try {
      const response = await fetch("/api/postfriendrq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        customToast({ message: `${result.message}`, type: "error" });
        return;
      }

      if (socket) {
        socket.emit("newFriendRequest", {
          senderUsername: senderUsername,
          receiverUsername: friendName,
        });
      }

      customToast({
        message: `Friend request sent to ${friendName}!`,
        type: "success",
      });
      setFriendName("");
    } catch (error) {
      console.error("Error adding friend:", error);
      customToast({
        message: "An unexpected error occurred. Please try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDenyRequest = async (friendUsername: string) => {
    if (!senderUsername) {
      customToast({
        message: "Error! Missing current username",
        type: "error",
      });
      return;
    }

    try {
      const deleteResponse = await fetch("/api/deletefriendrequest", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderUsername: friendUsername,
          receiverUsername: senderUsername,
        }),
      });

      const deleteResult = await deleteResponse.json();

      if (!deleteResponse.ok) {
        customToast({
          message: `Error rejecting request: ${deleteResult.message}`,
          type: "error",
        });
        return;
      }

      setPendingRequests((prevRequests) =>
        prevRequests.filter((user) => user.username !== friendUsername)
      );

      customToast({
        message: `Friend request from ${friendUsername} rejected!`,
        type: "success",
      });
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      customToast({
        message: "An unexpected error occurred. Please try again.",
        type: "error",
      });
    }
  };

  const handleAcceptRequest = async (friendUsername: string) => {
    if (!senderUsername) {
      customToast({
        message: "Error! Missing current username",
        type: "error",
      });
      return;
    }

    try {
      // Step 1: Update Friend Request Status
      const updateResponse = await fetch("/api/updatefriendstatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderUsername: friendUsername,
          receiverUsername: senderUsername,
          status: "accepted",
        }),
      });

      const friendsResponse = await fetch(
        `/api/getfriends?username=${senderUsername}`
      );
      const friendsData = await friendsResponse.json();

      if (friendsData.friends.includes(friendUsername)) {
        console.log("Friendship already exists, skipping duplicate entry.");
        return;
      }

      const updateResult = await updateResponse.json();

      if (!updateResponse.ok) {
        customToast({
          message: `Error updating status: ${updateResult.message}`,
          type: "error",
        });
        return;
      }

      // Step 2: Add to Friends Table
      const addFriendResponse = await fetch("/api/postaddfriend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderUsername: senderUsername,
          receiverUsername: friendUsername,
        }),
      });

      const addFriendResult = await addFriendResponse.json();

      if (!addFriendResponse.ok) {
        customToast({
          message: `Error adding friend: ${addFriendResult.message}`,
          type: "error",
        });
        return;
      }
      setPendingRequests((prevRequests) =>
        prevRequests.filter((user) => user.username !== friendUsername)
      );

      const userResponse = await fetch(`/api/getsingleuser?username=${friendUsername}`);
        const userData = await userResponse.json();

      if (!userResponse.ok) {
        console.error(
          `Error fetching user details for ${friendUsername}:`,
          userData
        );
        return;
      }

      setFriends((prev) => [
        ...prev,
        {
          id: userData.id,
          username: userData.data.username,
          image: userData.data.image || "/default-avatar.png",
          email: userData.data.email || "",
          name: userData.data.name || "",
          background: userData.data.background || "", // Provide default value
          description: userData.data.description || "", // Provide default value
        },
      ]);

      if (socket) {
        socket.emit("friendAccepted", {
          sender: senderUsername, // user2 (who accepted)
          receiver: friendUsername, // user1 (who sent the request)
        });
      }

      customToast({
        message: `You are now friends with ${friendUsername}!`,
        type: "success",
      });
    } catch (error) {
      console.error("Error accepting friend request:", error);
      customToast({
        message: "An unexpected error occurred. Please try again.",
        type: "error",
      });
    }
  };

  return (
    <aside className="bg-white shadow-md p-4 rounded-md flex flex-col h-[calc(100vh-120px)] overflow-y-auto">
      <div className="flex-1 flex flex-col justify-center items-center pt-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="transition-transform duration-200 hover:scale-110 active:scale-90">
              {" "}
              Add A Friend!{" "}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a Friend</DialogTitle>
              <DialogDescription>
                Enter your friend&apos;s name below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="friend-name">Friend&apos;s Name</Label>
              <Input
                id="friend-name"
                placeholder="Enter name..."
                value={friendName}
                onChange={(e) => setFriendName(e.target.value)}
              />
              {filteredUsers.length > 0 && (
                <ul className="bg-gray-100 p-2 rounded-md max-h-40 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <li
                      key={user.id}
                      className="p-2 hover:bg-gray-200 cursor-pointer flex justify-between items-center"
                      onClick={() => setFriendName(user.username)}
                    >
                      <div className="flex items-center gap-3 transition-transform duration-200 hover:scale-110 active:scale-90">
                        <Image
                          src={user.image}
                          alt="User Profile"
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                        <span>{user.username}</span>
                      </div>
                      <Link
                        key={user.id}
                        href={`/profile/${encodeURIComponent(user.username)}`}
                      >
                        <div className="px-4 py-2 bg-black text-white text-sm rounded-md transition-transform duration-200 hover:scale-110 active:scale-90">
                          Visit
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <Button onClick={handleAddFriend} disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Friend"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex-1 flex flex-col justify-center items-center border-b pb-4">
        <h2 className="text-lg font-semibold">Pending Friend Requests</h2>
        {pendingRequests.length > 0 ? (
          <ScrollArea className="w-full max-h-60 overflow-y-auto">
            <ul className="mt-2 w-full">
              {pendingRequests.map((user) => (
                <li
                  key={user.id}
                  className="flex justify-between items-center p-2 border-b"
                >
                  <Link
                    key={user.id}
                    href={`/profile/${encodeURIComponent(user.username)}`}
                  >
                    <div className="flex items-center gap-3">
                      <Image
                        src={user.image}
                        alt={user.username}
                        width={40}
                        height={40}
                        className="rounded-full border"
                        onError={(e) =>
                          console.error(
                            `Error loading image for ${user.username}:`,
                            e
                          )
                        }
                      />
                      <span className="text-md font-medium">
                        {user.username}
                      </span>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => handleAcceptRequest(user.username)}>
                      Accept
                    </Button>
                    <X
                      className="cursor-pointer text-red-500 hover:text-red-700"
                      onClick={() => handleDenyRequest(user.username)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        ) : (
          <p className="text-gray-500">No pending requests</p>
        )}
      </div>
    </aside>
  );
}
