"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Sidebar from "./Sidebar";
import Post from "./Post";
import ChatList from "./ChatList";

export default function UserCheck() {
    const { data: session } = useSession();
    const [usernameRequired, setUsernameRequired] = useState(false);
    const [username, setUsername] = useState("");
    const [usernameError, setUsernameError] = useState("");

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
                body: JSON.stringify({ email, name, image, username }),
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
                    <h2 className="text-xl font-bold mb-4">Choose a Username</h2>
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
                    <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
                        Submit
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-[250px_1fr_250px] gap-6 p-6 w-full">
            <Sidebar />
            <section className="flex flex-col space-y-6">
                <Post />
                <Post />
                <Post />
            </section>
            <ChatList />
        </div>
    );
}