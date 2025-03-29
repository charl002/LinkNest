import { Button } from "@/components/ui/button";
import { useFriends } from "../provider/FriendsProvider";
import { useState } from "react";
import { User } from "@/types/user";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import Image from "next/image";
import HoverCardComponent from "../custom-ui/HoverCardComponent";

// interface GroupChatsListProps {
//   Placeholder for now.
// }

const GroupChatsList = () => {
  const { friends } = useFriends();
  const [selectedFriends, setSelectedFriends] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState(""); // For search input
  const [groupName, setGroupName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleFriendSelect = (friend: User) => {
    setSelectedFriends((prev) =>
      prev.includes(friend)
        ? prev.filter((f) => f !== friend)
        : [...prev, friend]
    );

    setSearchTerm("");
  };

  const handleCreateGroup = () => {
    // For now, the function just logs the group name and selected friends.
    const finalGroupName =
      groupName || selectedFriends.map((friend) => friend.name).join(", "); // If no group name is given, just name the group with the usernames
    // Need to add the current user's username as well later
    console.log("Group Name:", finalGroupName);
    console.log("Selected Friends:", selectedFriends);

    setIsDialogOpen(false);
    setSelectedFriends([]);
    setGroupName("");
  };

  // Filter the friends based on the search query used.
  const filteredFriends = friends.filter((friend) =>
    friend.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function to remove a friend
  const handleRemoveFriend = (friendId: string) => {
    setSelectedFriends(prev => prev.filter(friend => friend.id !== friendId));
  };

  return (
    <div>
      <div className="text-gray-500 mb-4">No group chats yet.</div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button>Create Group Chat</Button>
        </DialogTrigger>

        <DialogContent>
          <DialogTitle>Create a New Group Chat</DialogTitle>
          <DialogDescription>
            Select friends and give your group a name.
          </DialogDescription>

          {/* Group Name Input */}
          <Input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name"
            className="mb-4"
          />

          {/* Search Input for filtering friends */}
          <div className="space-y-2">
            <Label htmlFor="friend-search">Search for a Friend</Label>
            <Input
              id="friend-search"
              placeholder="Search by username"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />
          </div>

          {/* Filtered Friends List (Appears dynamically as you type) */}
          {searchTerm && (
            <ul className="bg-gray-100 p-2 rounded-md max-h-40 overflow-y-auto">
              {filteredFriends.length > 0 ? (
                filteredFriends.map((friend) => (
                  <li
                    key={friend.id}
                    className={`p-2 hover:bg-gray-200 cursor-pointer flex justify-between items-center 
                      ${selectedFriends.includes(friend) ? "bg-gray-300" : ""}`
                    }
                    onClick={() => handleFriendSelect(friend)} // Select/deselect friend on click
                  >
                    <div
                      key={friend.id}
                      className={`flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-200 transition-transform duration-200 hover:scale-105 active:scale-90 rounded-md `}
                    >
                      <Image
                        src={friend.image}
                        alt="User Profile"
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      <span>{friend.username}</span>
                    </div>
                  </li>
                ))
              ) : (
                <div>No friends found.</div> // Display when no friends match the search
              )}
            </ul>
          )}

          <div className="mt-4">
            <h4 className="font-semibold pb-5">Selected Friends:</h4>
            <div className="flex flex-wrap justify-center gap-4">
              {selectedFriends.map((friend) => (
                <HoverCardComponent
                  key={friend.id}
                  image={friend.image || '/default-avatar.png'}
                  username={friend.username}
                  description={friend.description || 'This user seems to not have a description!'}
                  onRemove={() => handleRemoveFriend(friend.id)}
                />
              ))}
            </div>
          </div>

          {/* Create Group Button */}
          <Button onClick={handleCreateGroup} className="mt-4">
            Create Group
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupChatsList;
