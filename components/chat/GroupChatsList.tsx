import { Button } from "@/components/ui/button";
import { useFriends } from "../provider/FriendsProvider";
import { useEffect, useState } from "react";
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
import { Skeleton } from "../ui/skeleton";

interface GroupChatsListProps {
  currentUser: string | null;
}

interface GroupChat {
  id: string;
  name: string;
  members: (string | null)[];
  image: string;
}

const GroupChatsList = ({ currentUser }: GroupChatsListProps) => {
  const [groupChats, setGroupChats] = useState<GroupChat[]>([]);
  const { friends } = useFriends();
  const [selectedFriends, setSelectedFriends] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState(""); // For search input
  const [groupName, setGroupName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [groupImage, setGroupImage] = useState<File | null>(null)

  useEffect(() => {
    if (!currentUser) return;

    const fetchGroupChats = async () => {
      try {
        const response = await fetch(`/api/getgroupchats?user=${currentUser}`);
        const data = await response.json();

        if (response.ok) {
          setGroupChats(data.groupChats || []);
        } else {
          console.error("Error fetching group chats:", data.message);
        }
      } catch (error) {
        console.error("Error fetching group chats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupChats();
  }, [currentUser]);

  const handleFriendSelect = (friend: User) => {
    setSelectedFriends((prev) =>
      prev.includes(friend)
        ? prev.filter((f) => f !== friend)
        : [...prev, friend]
    );

    setSearchTerm("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGroupImage(file); // Store the selected file
    }
  };

  const handleCreateGroup = async () => {
    if (selectedFriends.length < 2) {
      setWarningMessage(
        "You need to select at least 2 friends to create a group chat."
      );
      return; // Prevent group creation if less than 2 friends are selected
    }

    let imageUrl = "";

    if (groupImage) {
      const formData = new FormData();
      formData.append("file", groupImage);
      formData.append("imageName", groupName);

      const response = await fetch("/api/postimage", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        imageUrl = result.fileUrl; // Set the image URL from the response
      } else {
        console.error("Failed to upload group image:", result.message);
      }
    }

    const finalGroupName =
      groupName || [currentUser, ...selectedFriends.map((friend) => friend.username)].join(", "); 
    // If no group name is given, use currentUser's username + the selected friend's usernames
    console.log("Group Name:", finalGroupName);
    console.log("Selected Friends:", selectedFriends);

    const groupMembers = [
      currentUser,
      ...selectedFriends.map((friend) => friend.username),
    ];

    try {
      const response = await fetch("/api/postgroupchat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupName: finalGroupName,
          members: groupMembers,
          image: imageUrl,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const { docId } = data; // Get docId from the response

        // Create the new group chat object with the returned docId
        const newGroupChat: GroupChat = {
          id: docId, // Use the Firestore docId here
          name: finalGroupName,
          members: groupMembers,
          image: imageUrl,
        };

        // Update the UI with the new group chat
        setGroupChats((prevChats) => [...prevChats, newGroupChat]);

        setIsDialogOpen(false);
        setSelectedFriends([]);
        setGroupName("");
        setGroupImage(null);
        setWarningMessage("");
      } else {
        setWarningMessage(data.message || "Failed to create the group chat.");
      }
    } catch (error) {
      setWarningMessage("An error occurred while creating the group chat.");
      console.error("Error creating group chat:", error);
    }
  };

  // Filter the friends based on the search query used.
  const filteredFriends = friends.filter((friend) =>
    friend.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Function to remove a friend
  const handleRemoveFriend = (friendId: string) => {
    setSelectedFriends((prev) =>
      prev.filter((friend) => friend.id !== friendId)
    );
  };

  const handleNevermind = () => {
    setSelectedFriends([]);
    setGroupName("");
    setWarningMessage("");
    setGroupImage(null);
    setIsDialogOpen(false);
  };

  const handleGroupChatSelect = (groupId: string) => {
    // Navigate to the group chat page
    console.log(`Navigating to group chat with ID: ${groupId}`);
    // In a real implementation, you would navigate to the group chat page like:
    // router.push(`/group-chat/${groupId}`);
  };


  // Temporary put a skeleton for loading.
  if (isLoading) {
    return (
      <>
        <Skeleton className="w-10 h-10 rounded-full" />{" "}
        {/* Avatar Skeleton */}
        <Skeleton className="h-4 w-24 rounded-md" />{" "}
        {/* Username & Time Skeleton */}
        <Skeleton className="h-12 w-40 rounded-md" />{" "}
        {/* Message Skeleton */}
      </>
    )
  }

  return (
    <div>
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
            placeholder="Enter group name (Optional) "
            className="mb-4"
          />

          <DialogDescription>
            Choose an image for your group (Optional).
          </DialogDescription>
          {/* Image Upload */}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mb-4"
          />
          {groupImage && (
            <div className="mb-4">
              <Image
                src={URL.createObjectURL(groupImage)}
                alt="Group Image"
                width={100}
                height={100}
                className="rounded-md"
              />
            </div>
          )}

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
                      ${selectedFriends.includes(friend) ? "bg-gray-300" : ""}`}
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
                  image={friend.image || "/default-avatar.png"}
                  username={friend.username}
                  description={
                    friend.description ||
                    "This user seems to not have a description!"
                  }
                  onRemove={() => handleRemoveFriend(friend.id)}
                />
              ))}
            </div>
          </div>

          {/* Warning Message */}
          {warningMessage && (
            <div className="text-red-500 text-sm mt-2">{warningMessage}</div>
          )}

          {/* Buttons */}
          <div className="flex gap-4 mt-4">
            <Button onClick={handleCreateGroup} className="flex-1">
              Create Group
            </Button>
            <Button
              onClick={handleNevermind}
              className="flex-1 bg-gray-300 text-black rounded-md hover:bg-gray-400 transition-all duration-200"
            >
              Nevermind
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Group Chats List */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">Your Group Chats:</h2>
        <div className="flex flex-col space-y-4">
          {groupChats.length > 0 ? (
            groupChats.map((group) => (
              <div key={group.id} className="bg-gray-100 mt-6 rounded-md shadow-md">
                <div className="relative flex items-center justify-between p-2 rounded-md">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">{group.name}</p>
                  </div>
                  <Button
                    className="transition-transform duration-200 hover:scale-105 active:scale-95"
                    onClick={() => handleGroupChatSelect(group.id)}
                  >
                    Chat
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p>No group chats available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupChatsList;
