import ChatList from "@/components/chat/ChatList"
import CreatePost from "@/components/post/CreatePost"
import Sidebar from "@/components/custom-ui/Sidebar"
import { Toaster } from "sonner"

export default function CreatePostPage() {
  return (
    <div className="grid grid-cols-[300px_2fr_300px] gap-6 p-6 w-full bg-gray-100">
      <Sidebar />
      <div className="bg-white shadow-md rounded-lg p-8 flex items-center justify-center flex-grow overflow-auto h-[calc(100vh-120px)]">
        <CreatePost />
      </div>
      <ChatList />
      <Toaster position="bottom-center" richColors></Toaster>
    </div>
  );
}