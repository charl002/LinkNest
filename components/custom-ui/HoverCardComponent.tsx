// components/HoverCardComponent.tsx
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@radix-ui/react-hover-card";
import Image from "next/image";

interface HoverCardComponentProps {
  image: string;
  username: string;
  description: string;
}

const HoverCardComponent = ({ image, username, description }: HoverCardComponentProps) => {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div
          className="flex items-center justify-center w-16 h-16 rounded-full overflow-hidden bg-gray-200 cursor-pointer"
        >
          <Image
            src={image || '/default-avatar.png'} // Default image if no image is provided
            alt={username}
            width={60}
            height={60}
            className="rounded-full border"
          />
        </div>
      </HoverCardTrigger>

      <HoverCardContent className="w-64 p-4 bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="flex items-center space-x-3">
          <Image
            src={image || '/default-avatar.png'}
            alt={username}
            width={40}
            height={40}
            className="rounded-full border"
          />
          <div className="flex flex-col">
            <span className="font-semibold">@{username}</span>
            <p className="text-sm text-gray-500">
              {description || "No description"}
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default HoverCardComponent;