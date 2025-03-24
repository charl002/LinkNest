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

interface UserData {
  id: string;
  data: {
    name: string;
    username: string;
    email: string;
    image: string;
    description: string;
    background: string;
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

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch(`/api/getsingleuser?username=${user}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch user");
      }

      setUserData(result);
      setUsername(result.data.username);
      setDescription(result.data.description);
    } catch (err) {
      setError((err as Error).message + " in LinkNest");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchFriends = useCallback(async () => {
    if (!sessionUsername) return;
    setIsFriendLoading(true);
    try {
      const response = await fetch(`/api/getfriends?username=${user}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to fetch friends");
      }

      setFriendsCount(result.friends.length);

      const friendsData = await Promise.all(
        result.friends.map(async (friendUsername: string) => {
          const userResponse = await fetch(`/api/getsingleuser?username=${friendUsername}`);
          const userData = await userResponse.json();

          if (userResponse.ok) {
            return { id: userData.id, ...userData.data };
          } else {
            console.error(`User ${friendUsername} not found`);
            return null;
          }
        })
      );
      const filteredFriends = friendsData.filter(Boolean);
      setFriends(filteredFriends);
      setIsFriend(filteredFriends.some(friend => friend.username === sessionUsername));
    } catch (err) {
      console.error("Error fetching friends:", err);
    } finally {
      setIsFriendLoading(false);
    }
  }, [user, sessionUsername]);

  const fetchPosts = useCallback(async () => {
    try {
      const [userResponse, postsResponse] = await Promise.all([
        fetch(`/api/getsingleuser?email=${email}`),
        fetch(`/api/getpostbyusername?username=${user}`)
      ]);

      if (!userResponse.ok) {
        throw new Error("Failed to fetch user");
      }

      const sessionUser = await userResponse.json();
      setSessionUsername(sessionUser.data?.username || "Unknown");

      if (!postsResponse.ok) {
        throw new Error("Failed to fetch posts");
      }

      const result = await postsResponse.json();
      const posts = result.posts || [];

      setPostsCount(posts.length);
      setPosts(posts);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  }, [user, email]);

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchData = async () => {
      if (isMounted) {
        await fetchPosts();
        await fetchUser();
        await fetchFriends();
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [fetchPosts, fetchUser, fetchFriends]);


   const handleAddFriend = async () => {
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
        customToast({ message: `${result.message}`, type: "error" });
        return;
      }

      customToast({ message: `Friend request sent to ${user}!`, type: "success" });

    } catch (error) {
      console.error("Error adding friend:", error);
      customToast({ message: "An unexpected error occurred. Please try again.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!session?.user?.name || !user) {
      customToast({ message: "Error! Missing username", type: "error" });
      return;
    }

    setIsLoading(true);

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
        customToast({ message: `${result.message}`, type: "error" });
        return;
      }

      customToast({ message: `You have removed ${user} as a friend.`, type: "success" });

      setIsFriend(false);
    } catch (error) {
      console.error("Error removing friend:", error);
      customToast({ message: "An unexpected error occurred. Please try again.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!userData) return;
  
    try {
      let profilePictureUrl = userData.data.image; 
      let backgroundPictureUrl = userData.data.background;
  
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
  
        profilePictureUrl = result.fileUrl; 
      }

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
  
        backgroundPictureUrl = result.fileUrl; 
      }
  
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
          background: backgroundPictureUrl
        }),
      });
  
      const updateResult = await updateResponse.json();
      if (!updateResponse.ok) {
        throw new Error(updateResult.message || "Failed to update profile");
      }
  
      setUserData((prev) =>
        prev ? { ...prev, data: { ...prev.data, username, description, image: profilePictureUrl } } : null
      );
  
      customToast({ message: "Profile updated successfully!", type: "success" });
      setIsDialogOpen(false);
    } catch (err) {
      customToast({ message: "Error updating profile: " + (err as Error).message, type: "error" });
    }
  };
  

  return (
    <div className="bg-white h-[calc(100vh-120px)] w-full text-gray-800">
      {loading && <LoadingLogo/>}
      {error && <p className="text-red-500 text-center py-6">{error}</p>}

      {userData && (
        <div className="w-full h-full mx-auto border border-gray-300 shadow-sm rounded-lg overflow-hidden">
      
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
                      <div className="px-4 py-0 bg-blue-500 text-white text-sm rounded-full ml-4 transition-transform duration-200 hover:scale-110 active:scale-90">
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
                  <button className="px-4 py-2 bg-blue-500 text-white text-sm rounded-full transition-transform duration-200 hover:scale-110 active:scale-90">
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
                  <button
                    className={`px-4 py-2 text-white text-sm rounded-full transition-transform duration-200 hover:scale-110 active:scale-90 ${
                      isFriend ? "bg-red-500" : "bg-blue-500"
                    }`}
                    onClick={isFriend ? handleRemoveFriend : handleAddFriend}
                    disabled={isLoading}
                  >
                    {isLoading ? "Processing..." : isFriend ? "Remove Friend" : "Add Friend"}
                  </button>
                )}
              </>
              )}
            </div>

            <div className="mt-3 flex space-x-6 text-gray-500 text-sm">
              <p>
                <span className="font-bold text-black">{postsCount}</span>
                {postsCount === 1 || postsCount == 0 ? " Post" : " Posts"}
              </p>
              <p 
                className="cursor-pointer hover:underline transition-transform duration-200 hover:scale-105 active:scale-95"
                onClick={() => setIsFriendsDialogOpen(true)}
              >
                <span className="font-bold text-black">{friendsCount}</span>
                {friendsCount === 1 || friendsCount == 0 ? " Friend" : " Friends"}
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

          <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-500px)]">
            {postsCount > 0 ? (posts.map((post, index) => 
              <Post 
                  key={`${post.id}-${index}`} 
                  {...post} 
                  profilePicture={userData.data.image || ""}
                  documentId={post.id}
                  postType={post.postType}
                  sessionUsername={sessionUsername}
              />)
              ) : (
              <p className="text-gray-600">No posts available.</p>
          )}
          </div>
        </div>
      )}
    </div>
  );
}
