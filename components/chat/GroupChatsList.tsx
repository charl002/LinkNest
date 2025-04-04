"use client";

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
// import { Skeleton } from "../ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useRouter, useSearchParams } from 'next/navigation';
import { GroupChat } from "@/types/group";
import { useGroupChats } from "../provider/GroupChatsProvider";
import { useSocket } from "../provider/SocketProvider";
import { Badge } from "../ui/badge";
import { decryptMessage } from "@/utils/decrypt";

interface GroupChatsListProps {
  currentUser: string | null;
  router: ReturnType<typeof useRouter>;
}

/**
 * This file is for the UI when looking at groupchats.
 * A lot of code is commented out (for message preview), did not have time to polish.
 */
const GroupChatsList = ({ currentUser, router }: GroupChatsListProps) => {
  const { groupChats } = useGroupChats();
  const { setGroupChats } = useGroupChats();
  const { friends } = useFriends();
  const [selectedFriends, setSelectedFriends] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState(""); // For search input
  const [groupName, setGroupName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string>("");
  // const [isLoading, setIsLoading] = useState(true);
  const [groupImage, setGroupImage] = useState<File | null>(null);
  const [unreadMessages, setUnreadMessages] = useState<Record<string, { count: number; message: string }>>({});
  const socket = useSocket();
  const searchParams = useSearchParams();
  const activeGroupId = searchParams.get("group");
  

  useEffect(() => {
    if (!socket || !currentUser) return;
  
    // Listen for group messages and update unread count
    socket.on("groupMessage", async ({ senderId, groupId, message }) => {
      if (groupId) {
        // If it's not from the current user, increment unread count
        if (senderId !== currentUser) {
          setUnreadMessages((prev) => {
            // If the current group is not being chatted with, increment the unread count
            if (activeGroupId !== groupId) {
              return {
                ...prev,
                [groupId]: {
                  count: (prev[groupId]?.count || 0) + 1, // Increment unread count for the group
                  message: decryptMessage(message),  // Keep the previous message, don't reset it
                },
              };
            }
  
            // If the current user is chatting in this group, reset the unread count
            return {
              ...prev,
              [groupId]: {
                count: 0, // Reset unread count for this group
                message: '',   // Set the actual new message
              },
            };
          });
        }
      }
  
      // Check if the receiver is online, if not update Firestore
      // if (activeGroupId === groupId) {
      //   try {
      //     await fetch("/api/postunreadmessage", {
      //       method: "POST",
      //       headers: { "Content-Type": "application/json" },
      //       body: JSON.stringify({
      //         sender: senderId,
      //         receiver: currentUser, // In this case, it's the group message
      //         count: 0, // Reset unread count
      //         message,
      //         groupId
      //       }),
      //     });
      //   } catch (error) {
      //     console.error("Error resetting unread count:", error);
      //   }
      // }
    });
  
    // Clean up the socket listener when the component unmounts
    return () => {
      socket.off("groupMessage");
    };
  }, [activeGroupId, currentUser, socket]);

  useEffect(() => {
    if (!currentUser) return;

    // const fetchUnreadMessages = async () => {
    //   try {
    //     const unreadCounts: Record<string, { count: number; message: string }> = {}; // Track count & message for each group
  
    //     // Assuming you have a `groupChats` state or context with the groupIds
    //     // Loop through each group chat
    //     const groupFetchPromises = groupChats.map(async (group) => {
    //       const groupId = group.id;
    //       console.log(`Fetching unread messages for group ${groupId}`);
  
    //       // Fetch unread messages from the API for this group
    //       const unreadResponse = await fetch(`/api/getunreadmessage?receiver=${currentUser}&groupId=${groupId}`);
    //       const unreadData = await unreadResponse.json();
  
    //       console.log(unreadData);
  
    //       if (unreadResponse.ok && unreadData?.unreadCounts && typeof unreadData.unreadCounts === 'object') {
    //         // Process unread messages for this group
    //         const groupUnreadMessages = unreadData.unreadCounts;
  
    //         // Initialize the group entry in unreadCounts if it doesn't exist yet
    //         unreadCounts[groupId] = unreadCounts[groupId] || { count: 0, message: "" };
  
    //         // Process each sender's unread message for the group
    //         Object.keys(groupUnreadMessages).forEach((sender) => {
    //           const encryptedMsg = groupUnreadMessages[sender].message;
    //           // Decrypt the message if it exists
    //           const decryptedMessage = encryptedMsg ? decryptMessage(encryptedMsg) : "";
  
    //           // Update the unread count for the group
    //           unreadCounts[groupId].count += groupUnreadMessages[sender].count;
    //           unreadCounts[groupId].message = decryptedMessage; // Store the last unread message
    //         });
    //       } else {
    //         console.warn(`Unread message data is not in the expected format for group ${groupId}:`, unreadData);
    //       }
    //     });
  
    //     await Promise.all(groupFetchPromises); // Wait for all fetches to complete
    //     setUnreadMessages(unreadCounts); // Update the unreadMessages state with the new data

    //     console.log('Updated unreadMessages:', unreadCounts); // Debugging
  
    //   } catch (error) {
    //     console.error("Error fetching unread messages for groups:", error);
    //   }
    // };

    // fetchUnreadMessages(); // Call the function to fetch unread messages
  
  }, [currentUser, groupChats]); // Dependencies: currentUser and groupChats
  
  // When u select a friend, they are added to the list.
  const handleFriendSelect = (friend: User) => {
    setSelectedFriends((prev) =>
      prev.includes(friend)
        ? prev.filter((f) => f !== friend)
        : [...prev, friend]
    );

    setSearchTerm("");
  };

  // Handles the image when the user selects one
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGroupImage(file); // Store the selected file
    }
  };

  // Create group chat logic
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
      formData.append("username", groupName);

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
      groupName ||
      [currentUser, ...selectedFriends.map((friend) => friend.username)].join(
        ", "
      );
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

    router.push(`/chat/?group=${groupId}&user=${currentUser}`);
  };

  // Temporary put a skeleton for loading.
  // if (isLoading) {
  //   return (
  //     <>
  //       <Skeleton className="w-10 h-10 rounded-full" /> {/* Avatar Skeleton */}
  //       <Skeleton className="h-4 w-24 rounded-md" />{" "}
  //       {/* Username & Time Skeleton */}
  //       <Skeleton className="h-12 w-40 rounded-md" /> {/* Message Skeleton */}
  //     </>
  //   );
  // }

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
                  image={friend.image || "/public/defaultProfilePic.png"}
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
            <Button
              onClick={handleNevermind}
              className="flex-1 bg-gray-300 text-black rounded-md hover:bg-gray-400 transition-all duration-200"
            >
              Nevermind
            </Button>
            <Button onClick={handleCreateGroup} className="flex-1">
              Create Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Group Chats List */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4">Your Group Chats:</h2>
        <div className="flex flex-col space-y-4">
          {groupChats.length > 0 && groupChats ? (
            groupChats.map((group) => (
              <div
                key={group.id}
                className="bg-gray-100 mt-6 rounded-md shadow-md"
              >
                <div className="relative flex items-center justify-between p-2 rounded-md">
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-10 h-10 bg-gray-800"> {/* Set custom background color */}
                      <AvatarImage src={group.image || "/defaultGroupPic.png"} alt={`Group chat image for ${group.name}`} />
                      <AvatarFallback>{group.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {/* Group name */}
                    <p className="text-sm font-medium">{group.name}</p>
                  </div>

                  {/* Badge for unread messages */}
                  {unreadMessages[group.id] && unreadMessages[group.id].count > 0 && (
                    <Badge variant="destructive" className="absolute top-0 right-0 -mr-0">
                      {unreadMessages[group.id].count}
                    </Badge>
                  )}
                
                  <Button
                    className="transition-transform duration-200 hover:scale-105 active:scale-95"
                    onClick={() => handleGroupChatSelect(group.id)}
                  >
                    Chat
                  </Button>
                </div>

                <div className="flex-1 ml-6 pb-2">
                  {unreadMessages?.[group.id]?.message ? (
                    <span className="text-xs text-gray-500">
                      {unreadMessages[group.id].message.length > 30
                        ? unreadMessages[group.id].message.substring(0, 30) + "..."
                        : unreadMessages[group.id].message}
                    </span>
                  ) : (
                    <span className="text-xs text-black-800">Chat with this Group!</span>
                  )}
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
