import Sidebar from "../../components/Sidebar";
import Post from "../../components/Post";
import ChatList from "../../components/ChatList";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
    const session = await auth();

    if (!session?.user) redirect("/");

    // Extract user data from the session
    const { email, name } = session.user;

    // Call the GET API to fetch all users
    try {
        const response = await fetch('http://localhost:3000/api/getalluser'); 
        
        if (!response.ok) {
          console.error("Failed to fetch users from Firebase");
          return;
        }
        const data = await response.json();
        console.log("data");
        console.log(data);

        // Check if the user's email already exists in the database
        const userExists = data.users.some((user: { email: string; name: string }) => user.email === email);

        if (!userExists) {
            // If the user doesn't exist, call the POST API to store the user's data
            const postResponse = await fetch('http://localhost:3000/api/postuser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, name }),
            });

            if (!postResponse.ok) {
                console.error("Failed to store user data in Firebase");
            }
        } 
        
        else {
            console.log("User already exists in the database");
        }

    } catch (err) {
        console.error("Error checking or storing user data:", err);
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