"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import ChatList from "./ChatList";
import Sidebar from "./Sidebar";
import Post from "./Post";
import { Toaster } from "sonner";

interface Post {
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
}

export default function UserCheck() {
    const { data: session } = useSession();
    const [usernameRequired, setUsernameRequired] = useState(false);
    const [username, setUsername] = useState("");
    const [description, setDescription] = useState("");
    const [usernameError, setUsernameError] = useState("");
    const [posts, setPosts] = useState<Post[]>([]);

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

    useEffect(() => {
        if (!session?.user) return;

        const fetchPosts = async () => {
            try {
                const response = await fetch('/api/bluesky/getfromdb');
                const newsresponse = await fetch('/api/news/getfromdb');
                const customResponse = await fetch('/api/getuserpost');
                const data = await response.json();
                const newsdata = await newsresponse.json();
                const customData = await customResponse.json();
                let allPosts: Post[] = [];

                if (data.success) {
                    // Add Bluesky posts to allPosts
                    allPosts = allPosts.concat(data.posts);
                }
                if (newsdata.success) {
                    // Add News posts to allPosts
                    allPosts = allPosts.concat(newsdata.posts);
                }
                if (customData.success){
                    allPosts = allPosts.concat(customData.posts);
                  }

                // Randomize the order of all posts
                const shuffledPosts = allPosts.sort(() => Math.random() - 0.5);
                setPosts(shuffledPosts);
            } catch (err) {
                console.error("Error fetching posts:", err);
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

    return (
        <div className="grid grid-cols-[250px_1fr_250px] gap-6 p-6 w-full h-screen">
            <Sidebar />
            <section className="flex flex-col space-y-6 h-full overflow-y-auto">
                {posts.map((post, index) => (
                <Post key={`${post.id}-${index}`} {...post} profilePicture={post.profilePicture}/>
                ))}
            </section>
            <ChatList />
            <Toaster position="bottom-center" richColors></Toaster>
        </div>
      ); 
}