import { Message } from "@/types/message";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { User } from "@/types/user";
import Link from "next/link"

interface ChatMessageProps {
  message: Message;
  isCurrentUser: boolean;
  user: User | null;
}

// This Display a message to the chat
export default function ChatMessage({ message, isCurrentUser, user }: ChatMessageProps) {
  const isCall = message.isCallMsg;

  return (
    <div className={`flex items-start space-x-4 ${isCurrentUser ? "justify-end ml-auto" : "justify-start"}`}>
      {/* Left-Side Messages (Friend) */}
      {!isCurrentUser && !isCall && (
        <div className="flex items-start space-x-4 bg-gray-100 rounded-lg p-2 max-w-[800px] shadow-md">
          <Link key={message.sender} href={`/profile/${encodeURIComponent(message.sender)}`}>
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.image || "/default-avatar.png"} alt="User Avatar" />
              <AvatarFallback>{message.sender.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex flex-col space-y-1">
            <Link key={message.sender} href={`/profile/${encodeURIComponent(message.sender)}`}>
              <div className="flex items-center space-x-2">
                <span className="text-black font-semibold">{message.sender}</span>
                <span className="text-xs text-gray-500">{message.date}</span>
              </div>
            </Link>
            <p className="text-black-600 text-sm">{message.message}</p>
          </div>
        </div>
      )}

      {/* Left-Side Call Messages (Friend) */}
      {!isCurrentUser && isCall && (
        <div className="flex items-start space-x-4 bg-yellow-100 rounded-lg p-2 max-w-full shadow-md">
          <Link key={message.sender} href={`/profile/${encodeURIComponent(message.sender)}`}>
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.image || "/default-avatar.png"} alt="User Avatar" />
              <AvatarFallback>{message.sender.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex flex-col space-y-1">
            <Link key={message.sender} href={`/profile/${encodeURIComponent(message.sender)}`}>
              <div className="flex items-center space-x-2">
                <span className="text-black font-semibold">{message.sender}</span>
                <span className="text-xs text-gray-500">{message.date}</span>
              </div>
            </Link>
            <p className="text-black-600 text-sm">{message.message}</p>
          </div>
        </div>
      )}

      {/* Right-Side Messages (Current User) */}
      {isCurrentUser && !isCall && (
        <div className="flex flex-col bg-blue-100 rounded-lg p-3 max-w-[800px] shadow-md ml-auto">
          <Link key={message.sender} href={`/profile/${encodeURIComponent(message.sender)}`}>
            <div className="flex items-center justify-end space-x-2">
              <span className="text-xs text-gray-500">{message.date}</span>
              <span className="text-black font-semibold">{message.sender}</span>
              <Avatar className="w-10 h-10">
                <AvatarImage src={user?.image || "/default-avatar.png"} alt="User Avatar" />
                <AvatarFallback>{message.sender.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>
          </Link>
          <p className="text-black-600 text-sm break-words">{message.message}</p>
        </div>
      )}

      {/* Right-Side Call Messages (Current User) */}
      {isCurrentUser && isCall && (
        <div className="flex items-start space-x-4 bg-yellow-100 rounded-lg p-2 max-w-full shadow-md ml-auto">
          <Link key={message.sender} href={`/profile/${encodeURIComponent(message.sender)}`}>
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.image || "/default-avatar.png"} alt="User Avatar" />
              <AvatarFallback>{message.sender.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>

          <div className="flex flex-col space-y-1">
            <Link key={message.sender} href={`/profile/${encodeURIComponent(message.sender)}`}>
              <div className="flex items-center space-x-2">
                <span className="text-black font-semibold">{message.sender}</span>
                <span className="text-xs text-gray-500">{message.date}</span>
              </div>
            </Link>
            <p className="text-black-600 text-sm">{message.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}