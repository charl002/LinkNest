"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import ChatList from "@/components/chat/ChatList";
import Sidebar from "@/components/custom-ui/Sidebar";
import Post from "@/components/post/Post";
import { Toaster } from "sonner";
import LoadingLogo from "@/components/custom-ui/LoadingLogo";

import { PostType } from "@/types/post";

export default function UserCheck() {
    const { data: session } = useSession();
    const [usernameRequired, setUsernameRequired] = useState(false);
    const [username, setUsername] = useState("");
    const [description, setDescription] = useState("");
    const [usernameError, setUsernameError] = useState("");
    const [posts, setPosts] = useState<PostType[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [sessionUsername, setSessionUsername] = useState('');
    const [activeTab, setActiveTab] = useState('user'); // Changed from 'all' to 'user'

    useEffect(() => {
        if (!session?.user) return;

        const { email } = session.user;

        const fetchData = async () => {
            try {
                const response = await fetch('/api/getalluser', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    console.error("Failed to fetch users from Firebase");
                    return;
                }

                const data = await response.json();

                // Check if the user's email already exists in the database
                const userExists = data.users.some((user: { email: string; name: string; image: string }) => user.email === email);

                if (!userExists) {
                    // If the user doesn't exist, show the username form
                    setUsernameRequired(true);
                } else {
                    console.log("User already exists in the database");
                }

            } catch (err) {
                console.error("Error checking or storing user data:", err);
            }
        };

        fetchData();
    }, [session]);

    // useEffect(() => {
    //   if (!sessionUsername) return;

    //   async function fetchFriends() {
    //       try {
    //           const response = await fetch(`/api/getfriends?username=${sessionUsername}`);
    //           const data = await response.json();

    //           if (!response.ok) {
    //               console.error("Error fetching friends:", data);
    //               return;
    //           }

    //           const friendsData = await Promise.all(
    //               data.friends.map(async (friendUsername: string) => {
    //                   const userResponse = await fetch(`/api/getuserbyusername?username=${friendUsername}`);
    //                   const userData = await userResponse.json();

    //                   return userResponse.ok ? { id: userData.id, ...userData.data } : null;
    //               })
    //           );

    //           setFriends(friendsData.filter(Boolean)); // Remove null values
    //       } catch (error) {
    //           console.error("Error fetching friends:", error);
    //       }
    //   }

    //   fetchFriends();
    // }, [sessionUsername, setFriends]); // Fetch friends when username is available

    useEffect(() => {
        if (!session?.user) return;

        const fetchPosts = async () => {
            setLoadingPosts(true);

            const sessionEmail = session?.user?.email;

            const response = await fetch(`/api/getsingleuser?email=${sessionEmail}`);
            const sessionUser = await response.json();

            if (response.ok) {
                setSessionUsername(sessionUser.data.username)
            } else {
                console.error(sessionUser.message);
            }

            try {
                const [response, newsResponse, customResponse] = await Promise.all([
                    fetch('/api/bluesky/getfromdb'),
                    fetch('/api/news/getfromdb'),
                    fetch('/api/getuserpost')
                ]);
    
                const [data, newsData, customData] = await Promise.all([
                    response.json(),
                    newsResponse.json(),
                    customResponse.json()
                ]);
                
                let allPosts: PostType[] = [];
                if (data.success) {
                    allPosts = allPosts.concat(data.posts);
                }

                if (newsData.success) {
                    allPosts = allPosts.concat(newsData.posts);
                }
                if (customData.success) {
                    allPosts = allPosts.concat(customData.posts);
                }

                const sortedPosts = [...allPosts]
                    .map(post => ({
                        ...post,
                        createdAt: post.createdAt
                    }))
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setPosts(sortedPosts);
            } catch (err) {
                console.error("Error fetching posts:", err);
            } finally {
                setLoadingPosts(false);
            }
        };

        fetchPosts();
    }, [session]);

    const checkUsernameAvailability = async (username: string) => {
        try {
            const response = await fetch('/api/getalluser', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                console.error("Failed to fetch users from Firebase");
                return false;
            }

            const data = await response.json();

            const usernameTaken = data.users.some((user: { username: string }) => user.username === username);

            return !usernameTaken; 
        } catch (err) {
            console.error("Error checking username availability:", err);
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!session?.user) return;

        const isUsernameAvailable = await checkUsernameAvailability(username);

        if (!isUsernameAvailable) {
            setUsernameError("Username is already taken. Please choose another one.");
            return;
        }

        if (username.length > 20 || username.length == 0){
            setUsernameError("Username should be between 1 and 20 charecters long.")
            return;
        }

        if (description.length > 350){
            setUsernameError("User desctiption should be less that 350 charecters long.")
            return;
        }

        const { email, name, image } = session!.user;

        try {
            const postResponse = await fetch('/api/postuser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, name, image, username, description }),
            });

            if (!postResponse.ok) {
                console.error("Failed to store user data in Firebase");
            } else {
                // Username has been submitted, hide the form
                setUsernameRequired(false);
            }
        } catch (err) {
            console.error("Error storing user data:", err);
        }
    };

    if (usernameRequired) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-3xl font-bold mb-4 text-center">Setup Your Account</h2>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded mb-4"
                        required
                    />
                    {usernameError && (
                        <p className="text-red-500 text-sm mb-4">{usernameError}</p>
                    )}
                    <input
                        type="text"
                        placeholder="Description (Optional)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded mb-4"
                    />
                    <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
                        Submit
                    </button>
                </form>
            </div>
        );
    }

    if (loadingPosts) {
        return <LoadingLogo/>;
    }

    return (
        <div className="grid grid-cols-[300px_1fr_300px] gap-6 p-6 w-full h-screen">
            <div className="w-[300px] max-h-[calc(100vh-3rem)] overflow-y-auto">
                <Sidebar />
            </div>
            <section className="flex flex-col h-full overflow-hidden">
                <div className="flex space-x-2 mb-6">
                    <button
                        onClick={() => setActiveTab('user')}
                        className={`flex-1 px-4 py-2 rounded-md transition-all ease-in-out duration-300 ${
                            activeTab === 'user' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                    >
                        Posts
                    </button>
                    <button
                        onClick={() => setActiveTab('bluesky')}
                        className={`flex-1 px-4 py-2 rounded-md transition-all ease-in-out duration-300 ${
                            activeTab === 'bluesky' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                    >
                        Bluesky
                    </button>
                    <button
                        onClick={() => setActiveTab('news')}
                        className={`flex-1 px-4 py-2 rounded-md transition-all ease-in-out duration-300 ${
                            activeTab === 'news' 
                                ? 'bg-blue-500 text-white' 
                                : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                    >
                        News
                    </button>
                </div>
                <div className="space-y-6 overflow-y-auto flex-1">
                    {posts
                        .filter(post => {
                            if (activeTab === 'user') return !['bluesky', 'news'].includes(post.postType);
                            if (activeTab === 'bluesky') return post.postType === 'bluesky';
                            if (activeTab === 'news') return post.postType === 'news';
                            return true;
                        })
                        .map((post, index) => (
                            <Post 
                                key={`${post.id}-${index}`} 
                                {...post} 
                                profilePicture={post.profilePicture || ""}
                                documentId={post.id}
                                postType={post.postType}
                                sessionUsername={sessionUsername}
                            />
                        ))
                    }
                </div>
            </section>
                <ChatList />
            <Toaster position="bottom-center" richColors></Toaster>
        </div>
    );
}