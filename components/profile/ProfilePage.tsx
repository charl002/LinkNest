"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Post from "../post/Post"; 
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { customToast } from "@/components/ui/customToast";
import Link from "next/link";

interface UserData {
  id: string;
  data: {
    name: string;
    username: string;
    email: string;
    image: string;
    description: string;
  };
}

interface Friend {
  id: string;
  image: string;
  username: string;
  name: string;
  email: string;
}

interface PostData {
  id: string;
  title: string;
  username: string;
  description: string;
  tags: string[];
  comments: { comment: string; username: string; date: string; likes: number }[];
  likes: number;
  images: { url: string; alt: string; thumb: string }[];
  createdAt: string;
  profilePicture: string;
  postType: 'posts' | 'bluesky' | 'news';
  likedBy: string[];
}

export default function ProfilePage({ user }: { user: string }) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsCount, setFriendsCount] = useState<number>(0);
  const [postsCount, setPostsCount] = useState<number>(0);
  const [posts, setPosts] = useState<PostData[]>([]);
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

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch(`/api/getuserbyusername?username=${user}`);
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
    }

    async function fetchFriends() {
      try {
        const response = await fetch(`/api/getfriends?username=${user}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to fetch friends");
        }

        setFriendsCount(result.friends.length);

        const friendsData = await Promise.all(
          result.friends.map(async (friendUsername: string) => {
            const userResponse = await fetch(`/api/getuserbyusername?username=${friendUsername}`);
            const userData = await userResponse.json();

            if (userResponse.ok) {
              return { id: userData.id, ...userData.data };
            } else {
              console.error(`User ${friendUsername} not found`);
              return null;
            }
          })
        );

        setFriends(friendsData.filter(Boolean));
      } catch (err) {
        console.error("Error fetching friends:", err);
      }
    }

    async function fetchPosts() {
      try {
        const response = await fetch(`/api/getpostbyusername?username=${user}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Failed to fetch friends");
        }

        setPostsCount(result.posts.length);
        setPosts(result.posts);
      } catch (err) {
        console.error("Error fetching friends:", err);
      }
    }

    
    fetchPosts();
    fetchUser();
    fetchFriends();
  }, [user]);


  const handleSaveChanges = async () => {
    if (!userData) return;

    try {
      const response = await fetch("/api/updateuser", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: userData.id,
          username,
          description,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update profile");
      }

      // Update local state
      setUserData((prev) =>
        prev ? { ...prev, data: { ...prev.data, username, description } } : null
      );

      customToast({ message: "Profile updated successfully!", type: "success" });
      setIsDialogOpen(false);
    } catch (err) {
      customToast({ message: "Error updating profile: " + (err as Error).message, type: "error" });
    }
  };

  return (
    <div className="bg-white min-h-screen w-full text-gray-800">
      {loading && <p className="text-center py-6">Loading...</p>}
      {error && <p className="text-red-500 text-center py-6">{error}</p>}

      {userData && (
        <div className="w-full h-full mx-auto border border-gray-300 shadow-sm rounded-lg overflow-hidden">
      
          <div className="w-full h-32 bg-gray-300 relative">
            <Image
              src={userData.data.image}
              alt="User Profile"
              layout="fill"
              objectFit="cover"
            />
          </div>

          <div className="p-4 relative">
            <div className="absolute -top-12 left-4">
              <Image
                src={userData.data.image}
                alt="User Profile"
                width={80}
                height={80}
                className="rounded-full border-4 border-white shadow-md"
              />
            </div>

            <div className="mt-8 flex justify-between items-center">
              <div>
                <p className="text-lg font-bold">{userData.data.name}</p>
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
                      <Label htmlFor="username" className="text-right">
                        Username
                      </Label>
                      <Input
                        id="username"
                        value={username}
                        readOnly
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
                <button className="px-4 py-2 bg-blue-500 text-white text-sm rounded-full">
                  Add Friend
                </button>
              )}
            </div>

            <div className="mt-3 flex space-x-6 text-gray-500 text-sm">
              <p>
                <span className="font-bold text-black">{postsCount}</span>
                {postsCount === 1 || postsCount == 0 ? " Post" : " Posts"}
              </p>
              <p 
                className="cursor-pointer hover:underline"
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

          <div className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-320px)]">
            {postsCount > 0 ? (posts.map((post, index) => 
              <Post 
                  key={`${post.id}-${index}`} 
                  {...post} 
                  profilePicture={userData.data.image || ""}
                  documentId={post.id}
                  postType={post.postType}
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
