import { Button } from "./ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function Sidebar() {
  const [friendName, setFriendName] = useState("");

    return (
      <aside className="bg-white shadow-md p-4 rounded-md flex flex-col space-y-4">
        <Dialog>
        <DialogTrigger asChild>
          <Button> Add A Friend! </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a Friend</DialogTitle>
            <DialogDescription>Enter your friend&apos;s username below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="friend-name">Username:</Label>
            <Input 
              id="friend-name" 
              placeholder="Enter username here" 
              value={friendName} 
              onChange={(e) => setFriendName(e.target.value)}
            />
            <Button onClick={() => alert(`Added ${friendName}`)}>Add Friend</Button>
          </div>
        </DialogContent>
      </Dialog>
      </aside>
    );
  }