"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import Post from "../post/Post"; 
import { useSession } from "next-auth/react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { customToast } from "@/components/ui/customToast";
import Link from "next/link";
import { Plus } from 'lucide-react';
import LoadingLogo from "@/components/custom-ui/LoadingLogo";
import { PostType } from "@/types/post";
import { User } from "@/types/user";
import ChatList from "../chat/ChatList";
import Sidebar from "../custom-ui/Sidebar";

interface UserData {
  id: string;
  data: {
    name: string;
    username: string;
    email: string;
    image: string;
    description: string;
    background: string;
    isAdmin: boolean;
    isBanned: boolean;
    isBlocked: boolean;
  };
}

export default function ProfilePage({ user }: { user: string }) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [friendsCount, setFriendsCount] = useState<number>(0);
  const [postsCount, setPostsCount] = useState<number>(0);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();
  const email = session?.user?.email;
  const [username, setUsername] = useState("");
  const [description, setDescription] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const fileInputRef1 = useRef<HTMLInputElement | null>(null);
  const [background, setBackground] = useState<File | null>(null);
  const fileInputRef2 = useRef<HTMLInputElement | null>(null);
  const [isFriendsDialogOpen, setIsFriendsDialogOpen] = useState(false);
  const [sessionUsername, setSessionUsername] = useState('');
  const [isFriend, setIsFriend] = useState(false);  
  const [isLoading, setIsLoading] = useState(false);
  const [isFriendLoading, setIsFriendLoading] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showChatList, setShowChatList] = useState(false);
  const [isSessionUserAdmin, setIsSessionUserAdmin] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  /**
   * Fetches user data based on the `username` query parameter.
   * 
   * This function:
   * - Calls the `/api/getsingleuser` endpoint
   * - Sets the user data, username, and description states if successful
   * - Catches and displays any error
   * - Finally, sets the loading state to false
   * 
   * @returns {Promise<void>} No return value, but updates state.
   */
  const fetchUser = useCallback(async () => {
    try {
      // Make an API request to fetch user info by username
      const response = await fetch(`/api/getsingleuser?username=${user}`);
      const result = await response.json();

      // If the response is not OK, throw an error with the message
      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch user");
      }

      if (result.data.isBanned) {
        window.location.href = '/banned';
        return;
      }

      // Update state with the retrieved user data
      setUserData(result);
      setUsername(result.data.username);
      setDescription(result.data.description);
    } catch (err) {
      // Handle and display errors
      setError((err as Error).message + " in LinkNest");
    } finally {
      // Indicate that loading has finished
      setLoading(false);
    }
  }, [user]);


  /**
   * Fetches the list of friends for a given user and their details.
   *
   * This function:
   * - Skips execution if `sessionUsername` is not available
   * - Fetches the list of friend usernames from the server
   * - For each friend, fetches detailed user data
   * - Filters out any failed friend fetches
   * - Sets the list of friends and friend count
   * - Determines if the current session user is a friend
   *
   * @returns {Promise<void>} No return value, but updates multiple states.
   */
  const fetchFriends = useCallback(async () => {
    // Exit early if there's no session user
    if (!sessionUsername) return;

    // Start the loading state for friends
    setIsFriendLoading(true);

    try {
      // Fetch the list of friend usernames
      const response = await fetch(`/api/getfriends?username=${user}`);
      const result = await response.json();

      // Throw if the fetch failed
      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch friends");
      }

      // Update the friend count
      setFriendsCount(result.friends.length);

      // Fetch data for each friend concurrently
      const friendsData = await Promise.all(
        result.friends.map(async (friendUsername: string) => {
          const userResponse = await fetch(`/api/getsingleuser?username=${friendUsername}`);
          const userData = await userResponse.json();

          // If friend data is successfully fetched, return structured info
          if (userResponse.ok) {
            return { id: userData.id, ...userData.data };
          } else {
            console.error(`User ${friendUsername} not found`);
            return null;
          }
        })
      );

      // Remove null entries (failed fetches)
      const filteredFriends = friendsData.filter(Boolean);

      // Update the state with the filtered friends
      setFriends(filteredFriends);

      // Check if the session user is a friend
      setIsFriend(filteredFriends.some(friend => friend.username === sessionUsername));
    } catch (err) {
      console.error("Error fetching friends:", err);
    } finally {
      // End the loading state for friends
      setIsFriendLoading(false);
    }
  }, [user, sessionUsername]);


  /**
   * Fetches user session data and all posts made by the target user.
   *
   * This function:
   * - Fetches the current session user's data by email
   * - Fetches posts by the target username
   * - Sets the session username and admin status
   * - Sets post data and post count
   *
   * @returns {Promise<void>}
   */
  const fetchPosts = useCallback(async () => {
    try {
      // Run both fetches in parallel
      const [userResponse, postsResponse] = await Promise.all([
        fetch(`/api/getsingleuser?email=${email}`),
        fetch(`/api/getpostbyusername?username=${user}`)
      ]);

      // Handle user response
      if (!userResponse.ok) {
        throw new Error("Failed to fetch user");
      }

      const sessionUser = await userResponse.json();
      setSessionUsername(sessionUser.data?.username || "Unknown");
      setIsSessionUserAdmin(sessionUser.data?.isAdmin || false);

      // Handle posts response
      if (!postsResponse.ok) {
        throw new Error("Failed to fetch posts");
      }

      const result = await postsResponse.json();
      const posts = result.posts || [];

      // Update state with posts
      setPostsCount(posts.length);
      setPosts(posts);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  }, [user, email]);

  /**
   * Checks whether the target user is blocked by the session user.
   *
   * This function:
   * - Fetches session user's data
   * - Checks if the `blockedUsers` list contains the target username
   * - Updates `isBlocked` state accordingly
   *
   * @returns {Promise<void>}
   */
  const checkBlockStatus = useCallback(async () => {
    // Skip if needed values are missing
    if (!sessionUsername || !user) return;

    try {
      // Fetch session user's info
      const response = await fetch(`/api/getsingleuser?username=${sessionUsername}`);
      const userData = await response.json();

      // Check if the target user is blocked
      if (response.ok && userData.data.blockedUsers) {
        setIsBlocked(userData.data.blockedUsers.includes(user));
      }
    } catch (err) {
      console.error("Error checking block status:", err);
    }
  }, [sessionUsername, user]);


  /**
   * Runs once on component mount to fetch:
   * - Posts
   * - User data
   * - Friends data
   * - Block status
   * 
   * Also sets up cleanup to abort fetches and avoid state updates if component unmounts.
   */
  useEffect(() => {
    let isMounted = true; // Avoid setting state on unmounted component
    const abortController = new AbortController(); // For canceling fetch requests

    const fetchData = async () => {
      if (isMounted) {
        await fetchPosts();
        await fetchUser();
        await fetchFriends();
        await checkBlockStatus();
      }
    };

    fetchData();

    // Cleanup to prevent memory leaks
    return () => {
      isMounted = false;
      abortController.abort(); // Cancel any in-progress fetches
    };
  }, [fetchPosts, fetchUser, fetchFriends, checkBlockStatus]);


  /**
   * Handles sending a friend request from the session user to the profile user.
   * 
   * Validates input, sends POST request to backend, and shows appropriate toast messages.
   *
   * @returns {Promise<void>}
   */
  const handleAddFriend = async () => {
    // Validate required fields
    if (!session?.user?.name || !user) {
      customToast({ message: "Error! Missing username", type: "error" });
      return;
    } else if (sessionUsername === user) {
      customToast({ message: "You can't add yourself!", type: "info" });
      return;
    }

    setIsLoading(true);

    const requestBody = {
      senderUsername: sessionUsername,
      receiverUsername: user,
    };

    try {
      const response = await fetch("/api/postfriendrq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        customToast({ message: result.message, type: "error" });
        return;
      }

      customToast({ message: `Friend request sent to ${user}!`, type: "success" });

    } catch (error) {
      console.error("Error adding friend:", error);
      customToast({
        message: "An unexpected error occurred. Please try again.",
        type: "error"
      });
    } finally {
      setIsLoading(false);
    }
  };


  /**
   * Handles removing a user from the friend list.
   * 
   * Validates the required fields, sends a DELETE request to the backend, 
   * and provides feedback via toast messages.
   *
   * @returns {Promise<void>}
   */
  const handleRemoveFriend = async () => {
    // Validate required fields before proceeding
    if (!session?.user?.name || !user) {
      customToast({ message: "Error! Missing username", type: "error" });
      return;
    }

    setIsLoading(true); // Set loading state to true while the request is in progress

    try {
      const response = await fetch("/api/deletefriend", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderUsername: sessionUsername,
          receiverUsername: user,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // If the request fails, show an error toast with the message
        customToast({ message: `${result.message}`, type: "error" });
        return;
      }

      // If successful, show a success toast and update friend status
      customToast({ message: `You have removed ${user} as a friend.`, type: "success" });

      setIsFriend(false); // Update local state to reflect the removed friend status
    } catch (error) {
      console.error("Error removing friend:", error);
      // If an unexpected error occurs, show a general error toast
      customToast({ message: "An unexpected error occurred. Please try again.", type: "error" });
    } finally {
      // Reset loading state once the operation completes (either success or failure)
      setIsLoading(false);
    }
  };


  /**
   * Handles the process of saving changes to the user's profile.
   * 
   * This function uploads profile and background pictures if they are changed,
   * then updates the user profile information and provides feedback to the user.
   *
   * @returns {Promise<void>}
   */
  const handleSaveChanges = async () => {
    if (!userData) return; // Exit early if userData is not available

    try {
      // Initialize URLs for profile and background pictures
      let profilePictureUrl = userData.data.image;
      let backgroundPictureUrl = userData.data.background;

      // If a new profile picture is selected, upload it
      if (profilePicture) {
        const formData = new FormData();
        formData.append("file", profilePicture);
        formData.append("username", sessionUsername);

        const response = await fetch("/api/postimage", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || "Failed to upload profile picture");
        }

        profilePictureUrl = result.fileUrl; // Update profile picture URL
      }

      // If a new background picture is selected, upload it
      if (background) {
        const formData = new FormData();
        formData.append("file", background);
        formData.append("username", sessionUsername);

        const response = await fetch("/api/postimage", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || "Failed to upload background picture");
        }

        backgroundPictureUrl = result.fileUrl; // Update background picture URL
      }

      // Send updated user profile data to the backend
      const updateResponse = await fetch("/api/updateuser", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: userData.id,
          username,
          description,
          image: profilePictureUrl,
          background: backgroundPictureUrl,
        }),
      });

      const updateResult = await updateResponse.json();
      if (!updateResponse.ok) {
        throw new Error(updateResult.message || "Failed to update profile");
      }

      // Update local state with the new user data
      setUserData((prev) =>
        prev ? { ...prev, data: { ...prev.data, username, description, image: profilePictureUrl } } : null
      );

      // Provide success feedback and close the dialog
      customToast({ message: "Profile updated successfully!", type: "success" });
      setIsDialogOpen(false);
    } catch (err) {
      // Provide error feedback if something goes wrong
      customToast({ message: "Error updating profile: " + (err as Error).message, type: "error" });
    }
  };


  /**
   * Handles banning or unbanning a user.
   * 
   * This function sends a request to the server to toggle the ban status of a user.
   * It also updates the local state and provides feedback to the user.
   *
   * @returns {Promise<void>}
   */
  const handleBanUser = async () => {
    if (!userData) return; // Exit if user data is not available

    try {
      // Send a request to ban or unban the user
      const response = await fetch("/api/banuser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userData.id,
          isBanned: !userData.data.isBanned, // Toggle the ban status
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to update ban status");
      }

      // Update local state with the new ban status
      setUserData((prev) =>
        prev
          ? {
              ...prev,
              data: { ...prev.data, isBanned: !prev.data.isBanned },
            }
          : null
      );

      // Provide feedback to the user
      customToast({
        message: userData.data.isBanned
          ? `${userData.data.username} has been unbanned.`
          : `${userData.data.username} has been banned.`,
        type: "success",
      });
    } catch (err) {
      // Provide error feedback if something goes wrong
      customToast({
        message: "Error updating ban status: " + (err as Error).message,
        type: "error",
      });
    }
  };


  /**
   * Handles blocking or unblocking a user.
   * 
   * This function sends a request to the server to block or unblock a user,
   * updates the local blocked status, and provides feedback to the user.
   *
   * @returns {Promise<void>}
   */
  const handleBlockUser = async () => {
    if (!userData || !sessionUsername) return; // Exit if necessary data is missing

    try {
      // Send a request to block the user
      const response = await fetch("/api/blockuser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: sessionUsername, // The current session user
          blockedUserId: userData.data.username, // The user being blocked
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to update block status");
      }

      // Toggle the blocked status locally
      setIsBlocked((prev) => !prev);

      // Provide feedback to the user
      customToast({ message: result.message, type: "success" });
    } catch (err) {
      // Provide error feedback if something goes wrong
      customToast({
        message: "Error updating block status: " + (err as Error).message,
        type: "error",
      });
    }
  };


  let profileContent = null;
  if (userData) profileContent = (
    <div className="w-full h-full mx-auto bg-white border border-gray-300 shadow-sm rounded-lg overflow-auto custom-scrollbar">
      <div className="w-full h-32 bg-gray-300 relative">
        <Image
          src={userData.data.background || userData.data.image}
          alt="User Profile"
          layout="fill"
          objectFit="cover"
        />
      </div>

      <div className="p-4 relative">
        <button onClick={() => setIsZoomed(true)} className="absolute -top-12 left-4">
          <Image
            src={userData.data.image}
            alt="User Profile"
            width={80}
            height={80}
            className="rounded-full border-4 border-white shadow-md"
          />
        </button>

        <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 flex items-center justify-center bg-transparent shadow-none border-none">
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 z-50 p-2 bg-white rounded-full hover:bg-gray-200"
            >
              X
            </button>
            <DialogHeader>
              <DialogTitle className="sr-only">Media Preview</DialogTitle>
            </DialogHeader>
            <div className="relative w-[40vw] h-[90vh] flex items-center justify-center">
              <Image 
                src={userData.data.image}
                alt="User Profile"
                fill
                priority
                className="rounded-full border-4 border-white shadow-md"
                sizes="100vw"
              />
            </div>
          </DialogContent>
        </Dialog>

        <div className="mt-8 flex justify-between items-center">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold">{userData.data.name}</p>
              {userData.data.email === email && (
                <Link href="/createpost">
                  <div className="px-4 py-0 bg-blue-500 text-white text-sm rounded-full ml-4">
                    <Plus />
                  </div>
                </Link>
              )}
            </div>
            <p className="text-gray-500">@{userData.data.username}</p>
            <br />
            <p className="text-gray-700">{userData.data.description}</p>
          </div>
          {userData.data.email === email ? (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <button className="px-4 py-2 bg-blue-500 text-white text-sm rounded-full">
                  Profile settings
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit profile</DialogTitle>
                  <DialogDescription>
                    Make changes to your profile here. Click save when you are done.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-right">
                      Photo
                    </Label>
                    <Input
                      type="file"
                      ref={fileInputRef1}
                      onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-right">
                      Background
                    </Label>
                    <Input
                      type="file"
                      ref={fileInputRef2}
                      onChange={(e) => setBackground(e.target.files?.[0] || null)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" onClick={handleSaveChanges}>
                    Save changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <>
              {isFriendLoading ? (
                <button className="px-4 py-2 bg-gray-300 text-white text-sm rounded-full" disabled>
                  Loading...
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    className={`px-4 py-2 text-white text-sm rounded-full transition-transform duration-200 hover:scale-110 active:scale-90 ${
                      isFriend ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
                    }`}
                    onClick={isFriend ? handleRemoveFriend : handleAddFriend}
                    disabled={isLoading}
                  >
                    {isLoading ? "Processing..." : isFriend ? "Remove Friend" : "Add Friend"}
                  </button>
                  {userData.data.email !== email && (
                    <button
                      className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white text-sm rounded-full transition-transform duration-200 hover:scale-110 active:scale-90"
                      onClick={handleBlockUser}
                    >
                      {isBlocked ? "Unblock User" : "Block User"}
                    </button>
                  )}
                  {isSessionUserAdmin && userData.data.email !== email && (
                    <button
                      className={`px-4 py-2 text-white text-sm rounded-full transition-transform duration-200 hover:scale-110 active:scale-90 ${
                        userData.data.isBanned 
                          ? "bg-emerald-500 hover:bg-emerald-600" 
                          : "bg-rose-500 hover:bg-rose-600"
                      }`}
                      onClick={handleBanUser}
                    >
                      {userData.data.isBanned ? "Unban User" : "Ban User"}
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-3 flex space-x-6 text-gray-500 text-sm">
          <p>
            <span className="font-bold text-black">{postsCount}</span>
            {postsCount === 1 || postsCount === 0 ? " Post" : " Posts"}
          </p>
          <p 
            className="cursor-pointer hover:underline"
            onClick={() => setIsFriendsDialogOpen(true)}
          >
            <span className="font-bold text-black">{friendsCount}</span>
            {friendsCount === 1 || friendsCount === 0 ? " Friend" : " Friends"}
          </p>

          <Dialog open={isFriendsDialogOpen} onOpenChange={setIsFriendsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Friends List</DialogTitle>
              </DialogHeader>
              <div className="max-h-60 overflow-y-auto">
                {friends.length > 0 ? (
                  <ul className="space-y-2">
                    {friends.map((friend, index) => (
                      <Link key={index} href={`/profile/${encodeURIComponent(friend.username)}`}>
                        <li className="p-2 border-b text-gray-700 hover:bg-gray-200 cursor-pointer flex items-center">
                          <Image 
                            src={friend.image} 
                            alt={friend.username} 
                            width={40} 
                            height={40} 
                            className="rounded-full border"
                          />
                          <p className="text-sm font-medium ml-4">{friend.username}</p> 
                        </li>
                      </Link>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No friends yet.</p>
                )}
              </div>
              <DialogFooter>
                <Button onClick={() => setIsFriendsDialogOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-4 flex border-b text-sm">
          <p className="text-blue-500 font-semibold border-b-2 border-blue-500 pb-2 px-4">
            Posts
          </p>
        </div>
      </div>

      <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-320px)]">
        {postsCount > 0 ? (
          posts.map((post, index) => (
            <Post 
              key={`${post.id}-${index}`} 
              {...post} 
              profilePicture={userData.data.image || ""}
              documentId={post.id}
              postType={post.postType}
              sessionUsername={sessionUsername}
            />
          ))
        ) : (
          <p className="text-gray-600">No posts available.</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-gray-100 min-h-screen w-full text-gray-800">
      {loading && <LoadingLogo/>}
      {error && <p className="text-red-500 text-center py-6">{error}</p>}

      {userData && (
        <>
          {/* Mobile View Toggle Buttons */}
          <div className="md:hidden flex justify-between p-4 gap-4">
            <button
              onClick={() => {
                setShowSidebar(prev => !prev);
                setShowChatList(false);
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded-md w-1/2"
            >
              {showSidebar ? "Close Sidebar" : "Sidebar"}
            </button>
            <button
              onClick={() => {
                setShowChatList(prev => !prev);
                setShowSidebar(false);
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded-md w-1/2"
            >
              {showChatList ? "Close Friends" : "Friends"}
            </button>
          </div>

          {/* Mobile View Content */}
          <div className="md:hidden min-h-screen overflow-y-auto px-4">
            {showSidebar && <Sidebar />}
            {showChatList && <ChatList />}
            {!showSidebar && !showChatList && profileContent}
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:grid grid-cols-[300px_1fr_300px] gap-6 p-6 h-[calc(100vh-4rem)] overflow-hidden">
            <div className="w-full max-h-[calc(100vh-3rem)] overflow-y-auto">
              <Sidebar />
            </div>
            <div className="h-full overflow-y-auto">{profileContent}</div>
            <div className="w-full max-h-[calc(100vh-3rem)] overflow-y-auto">
              <ChatList />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
