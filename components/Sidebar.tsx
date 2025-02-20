import { Button } from "./ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

interface User {
  id: string;
  image: string;
  username: string;
  email: string;
  name: string;
}

export default function Sidebar() {
  const [friendName, setFriendName] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

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
      console.log("Users:", users);
      setFilteredUsers(users.filter(user => 
        user.username && user.username.toLowerCase().includes(friendName.toLowerCase())
      ));
    }
  }, [friendName, users]);  

  return (
    <aside className="bg-white shadow-md p-4 rounded-md flex flex-col space-y-4">
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
            <Button onClick={() => alert(`Added ${friendName}`)}>Add Friend</Button>
          </div>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
