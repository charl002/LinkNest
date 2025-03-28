import { Button } from '@/components/ui/button';
import { useFriends } from "../provider/FriendsProvider";
import { useState } from 'react';
import { User } from '@/types/user';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';

// interface GroupChatsListProps {
//   Placeholder for now.
// }

const GroupChatsList = () => {
  const { friends } = useFriends();
  const [selectedFriends, setSelectedFriends] = useState<User[]>([]);
  const [groupName, setGroupName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleFriendSelect = (friend: User) => {
    setSelectedFriends(prev => 
      prev.includes(friend) ? prev.filter(f => f !== friend) : [...prev, friend]
    );
  };

  const handleCreateGroup = () => {
    // For now, the function just logs the group name and selected friends.
    const finalGroupName = groupName || selectedFriends.map(friend => friend.name).join(', '); // If no group name is given, just name the group with the usernames
    // Need to add the current user's username as well later
    console.log('Group Name:', finalGroupName);
    console.log('Selected Friends:', selectedFriends);

    setIsDialogOpen(false);
  };

  return (
    <div>
      <div className="text-gray-500 mb-4">No group chats yet.</div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button>Create Group Chat</Button>
        </DialogTrigger>
        
        <DialogContent>
          <DialogTitle>Create a New Group Chat</DialogTitle>
          <DialogDescription>Select friends and give your group a name.</DialogDescription>
          
          {/* Group Name Input */}
          <Input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name"
            className="mb-4"
          />
          
          {/* Friends list with checkboxes */}
          <div className="space-y-2">
            {friends.map((friend) => (
              <div key={friend.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedFriends.includes(friend)}
                  onChange={() => handleFriendSelect(friend)}
                  className="mr-2"
                />
                <span>{friend.username}</span>
              </div>
            ))}
          </div>
          
          {/* Create Group Button */}
          <Button onClick={handleCreateGroup} className="mt-4">Create Group</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupChatsList;
