import { Toaster } from "sonner";
import ModerationPanel from "@/components/moderation/ModerationPanel";
import Sidebar from "@/components/custom-ui/Sidebar";
import ChatList from "@/components/chat/ChatList";

export default function ModerationPage() {
    return (
        <div className="grid grid-cols-[300px_2fr_300px] gap-6 p-6 w-full">
            <Sidebar />
            <ModerationPanel />
            <ChatList />
            <Toaster position="bottom-center" richColors />
        </div>
    );
}