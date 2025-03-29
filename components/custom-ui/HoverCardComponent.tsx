// components/HoverCardComponent.tsx
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@radix-ui/react-hover-card";
import { X } from "lucide-react";
import Image from "next/image";

interface HoverCardComponentProps {
  image: string;
  username: string;
  description: string;
  onRemove: () => void;
}

// Probably would want to pass in the width and height to set the size of the image to hover (Instead of the default 60)
const HoverCardComponent = ({
  image,
  username,
  description,
  onRemove,
}: HoverCardComponentProps) => {
  return (
    <div className="relative group">
      <HoverCard>
        <HoverCardTrigger asChild>
          <div className="relative inline-block">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 cursor-pointer relative">
              <Image
                src={image || "/default-avatar.png"}
                alt={username}
                width={60}
                height={60}
                className="rounded-full border"
              />
            </div>
          </div>
        </HoverCardTrigger>

        <HoverCardContent className="w-64 p-4 bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <Image
              src={image || "/default-avatar.png"}
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

      {/* X button positioned outside of HoverCard component
        We will probably need a condition to conditionally render the X
      */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="absolute -top-2 -right-1 bg-red-500 text-white rounded-full p-1 text-xs cursor-pointer hover:bg-red-600 transition-all z-50 shadow-md"
        aria-label="Remove friend"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default HoverCardComponent;