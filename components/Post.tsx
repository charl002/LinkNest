export default function Post() {
    return (
      <div className="bg-white shadow-md p-4 rounded-md">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
          <p className="font-bold">Username</p>
        </div>
        <div className="mt-4 bg-gray-200 h-40 w-full rounded-md"></div>
        <p className="mt-2 font-semibold">Post Title</p>
        <p className="text-gray-500">Post Description...</p>
        <p className="text-blue-500 text-sm mt-2">#Cool #Funny</p>
      </div>
    );
  }