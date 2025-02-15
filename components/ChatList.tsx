export default function ChatList() {
    const users = ["User1", "User2", "User3"];
  
    return (
      <aside className="bg-white shadow-md p-4 rounded-md">
        <h2 className="text-lg font-semibold mb-4">Chat</h2>
        <div className="flex flex-col space-y-2">
          {users.map((user) => (
            <div key={user} className="flex items-center space-x-2 p-2 bg-gray-100 rounded-md">
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
              <p>{user}</p>
            </div>
          ))}
        </div>
      </aside>
    );
  }