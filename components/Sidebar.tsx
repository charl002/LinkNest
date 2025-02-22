"use client";

import { Button } from "./ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { customToast } from "./ui/customToast";

interface User {
  id: string;
  image: string;
  username: string;
  email: string;
  name: string;
}

export default function Sidebar() {
  const { data: session } = useSession();
  const [friendName, setFriendName] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const currentUser = users.find(user => user.email === session?.user?.email);
  const senderUsername = currentUser?.username || null;

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
      setFilteredUsers(users.filter(user => 
        user.username && user.username.toLowerCase().includes(friendName.toLowerCase())
      ));
    }
  }, [friendName, users]);

  useEffect(() => {
    if (!currentUser) return;
  
    async function fetchPendingRequests() {
      try {
        const response = await fetch(`/api/getpendingrequests?username=${senderUsername}`);
        const data = await response.json();
  
        if (data && Array.isArray(data.pendingRequests)) {
          const userRequests = await Promise.all(
            data.pendingRequests.map(async (username: string) => {
              const userResponse = await fetch(`/api/getuserbyusername?username=${username}`);
              const userData = await userResponse.json();
  
              if (userResponse.ok) {
                return { id: userData.id, ...userData.data };
              } else {
                console.error(`User ${username} not found`);
                return null;
              }
            })
          );
          setPendingRequests(userRequests.filter(Boolean));
        } else {
          console.error("Unexpected API response:", data);
          setPendingRequests([]);
        }
      } catch (error) {
        console.error("Error fetching pending requests:", error);
        setPendingRequests([]);
      }
    }
  
    fetchPendingRequests();
  }, [currentUser, senderUsername]);

  const handleAddFriend = async () => {
    if (!session?.user?.name || !friendName) {
      customToast({message: `Error! Missing username`, type: "error"});
      return;
    } else if(senderUsername === friendName){
      customToast({message: "You can't add yourself!", type: "info"});
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
    
      customToast({ message: `Friend request sent to ${friendName}!`, type: "success" });
      setFriendName("");
    } catch (error) {
      console.error("Error adding friend:", error);
      customToast({ message: "An unexpected error occurred. Please try again.", type: "error" });
    } finally {
      setIsLoading(false);
    }    
  };

  return (
    <aside className="bg-white shadow-md p-4 rounded-md flex flex-col h-full">
      <div className="flex-1 flex flex-col justify-center items-center pt-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button> Add A Friend! </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a Friend</DialogTitle>
              <DialogDescription>Enter your friend&apos;s name below.</DialogDescription>
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
                  {filteredUsers.map(user => (
                    <li 
                      key={user.id} 
                      className="p-2 hover:bg-gray-200 cursor-pointer"
                      onClick={() => setFriendName(user.username)}
                    >
                      {user.username}
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
          <ul className="mt-2 w-full">
            {pendingRequests.map((user) => (
              <li key={user.id} className="flex justify-between items-center p-2 border-b">
                <div className="flex items-center gap-3">
                  
                  <span className="text-md font-medium">{user.username}</span>
                </div>
                <Button onClick={() => handleAcceptRequest(user.username)}>Accept</Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No pending requests</p>
        )}
      </div>
    </aside>
  );
}
