"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function UserCheck() {
    const { data: session } = useSession();

    useEffect(() => {
        if (!session?.user) return;

        const { email, name, image } = session.user;

        // Call the GET API to fetch all users
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
                console.log(data);

                // Check if the user's email already exists in the database
                const userExists = data.users.some((user: { email: string; name: string; image: string }) => user.email === email);

                if (!userExists) {
                    // If the user doesn't exist, call the POST API to store the user's data
                    const postResponse = await fetch('/api/postuser', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ email, name, image }),
                    });

                    if (!postResponse.ok) {
                        console.error("Failed to store user data in Firebase");
                    }
                } else {
                    console.log("User already exists in the database");
                }

            } catch (err) {
                console.error("Error checking or storing user data:", err);
            }
        };

        fetchData();
    }, [session]);

    return null;
}