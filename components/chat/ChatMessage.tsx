import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { User } from "@/types/user";

interface ChatMessageProps {
  message: {
    sender: string;
    message: string;
    date: string;
  };
  isCurrentUser: boolean;
  user: User | null;
}

export default function ChatMessage({ message, isCurrentUser, user }: ChatMessageProps) {
  return (
    <div className={`flex items-start space-x-4 ${isCurrentUser ? "justify-end ml-auto" : "justify-start"}`}>
      {/* Left-Side Messages (Friend) */}
      {!isCurrentUser && (
        <div className="flex items-start space-x-4 bg-gray-100 rounded-lg p-2 max-w-[800px] shadow-md">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user?.image || "/default-avatar.png"} alt="User Avatar" />
            <AvatarFallback>{message.sender.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-black font-semibold">{message.sender}</span>
              <span className="text-xs text-gray-500">{message.date}</span>
            </div>
            <p className="text-black-600 text-sm">{message.message}</p>
          </div>
        </div>
      )}

      {/* Right-Side Messages (Current User) */}
      {isCurrentUser && (
        <div className="flex flex-col bg-blue-100 rounded-lg p-3 max-w-[800px] shadow-md ml-auto">
          <div className="flex items-center justify-end space-x-2">
            <span className="text-xs text-gray-500">{message.date}</span>
            <span className="text-black font-semibold">{message.sender}</span>
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.image || "/default-avatar.png"} alt="User Avatar" />
              <AvatarFallback>{message.sender.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
          <p className="text-black-600 text-sm">{message.message}</p>
        </div>
      )}
    </div>
  );
}