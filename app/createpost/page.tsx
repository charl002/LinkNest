import ChatList from "@/components/ChatList";
import CreatePost from "@/components/CreatePost";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "sonner";

export default function CreatePostPage() {
    return (
        <div className="grid grid-cols-[300px_2fr_300px] gap-6 p-6 w-full min-h-screen bg-gray-100">
            <Sidebar />
            <div className="bg-white shadow-md rounded-lg p-8 flex items-center justify-center">
                <CreatePost />
            </div>
            <ChatList />
            <Toaster position="bottom-center" richColors></Toaster>
        </div>
    );
}