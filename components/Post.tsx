interface PostProps {
    title: string;
    username: string;
    description: string;
    tags: string[];
    comments: string[];
    likes: number;
}

export default function Post({ title, username, description, tags, comments, likes }: PostProps) {
    return (
      <div className="bg-white shadow-md p-4 rounded-md">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
          <p className="font-bold">{username}</p>
        </div>
        <div className="mt-4 bg-gray-200 h-40 w-full rounded-md"></div>
        <p className="mt-2 font-semibold">{title}</p>
        <p className="text-gray-500">{description}</p>
        <p className="text-blue-500 text-sm mt-2">{tags.join(' ')}</p>
        <div className="mt-4 flex items-center">
          <span className="text-gray-600">{likes} {likes === 1 ? 'like' : 'likes'}</span>
        </div>
        <div className="mt-4">
          {comments.map((comment, index) => (
            <p key={index} className="text-gray-600">{comment}</p>
          ))}
        </div>
      </div>
    );
}