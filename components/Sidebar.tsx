export default function Sidebar() {
    return (
      <aside className="bg-white shadow-md p-4 rounded-md flex flex-col space-y-4">
        <input
          type="text"
          placeholder="Search Users"
          className="w-full p-2 border rounded-md"
        />
        <button className="bg-gray-300 px-4 py-2 rounded-md">Search</button>
      </aside>
    );
  }