export default function Navbar() {
    return (
      <nav className="bg-white shadow-md py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">LinkNest</h1>
        <div className="flex items-center space-x-4">
          <button className="bg-gray-200 px-4 py-2 rounded">Profile</button>
        </div>
      </nav>
    );
  }