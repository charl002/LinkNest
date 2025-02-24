import Image from 'next/image';

interface PostProps {
    title: string;
    username: string;
    description: string;
    tags: string[];
    comments: { comment: string; username: string; date: string; likes: number }[];
    likes: number;
    images: { url: string; alt: string; thumb: string }[];
    profilePicture: string;
}

export default function Post({ title, username, description, tags, comments, likes, images, profilePicture }: PostProps) {
    const defaultImageUrl = "/defaultProfilePic.jpg";

    return (
      <div className="bg-white shadow-md p-4 rounded-md">
        <div className="flex items-center space-x-2">
          {profilePicture ? (
            <Image 
              src={profilePicture} 
              alt={`${username}'s profile picture`} 
              width={40} 
              height={40} 
              className="rounded-full" 
              layout="fixed"
            />
          ) : (
            <div className="rounded-full bg-gray-200 w-10 h-10 flex items-center justify-center">
              <Image 
                src={defaultImageUrl} 
                alt="Default Profile" 
                width={40} 
                height={40} 
                className="rounded-full" 
              />
            </div>
          )}
          <p className="font-bold">{username}</p>
        </div>
        {images.length > 0 && images[0].url ? (
          <Image 
            src={images[0].url} 
            alt={images[0].alt} 
            width={640} 
            height={160} 
            className="mt-4 bg-gray-200 rounded-md" 
            layout="responsive"
          />
        ) : null}
        <p className="mt-2 font-semibold">{title}</p>
        <p className="text-gray-500">{description}</p>
        <p className="text-blue-500 text-sm mt-2">{tags.join(' ')}</p>
        <div className="mt-4 flex items-center">
          <span className="text-gray-600">{likes} {likes === 1 ? 'like' : 'likes'}</span>
        </div>
        <div className="mt-4">
          {comments.length > 0 ? (
            comments.map((comment, index) => (
              <div key={index} className="text-gray-600">
                <p><strong>{comment.username}:</strong> {comment.comment}</p>
                <p className="text-gray-400 text-sm">{comment.date}</p>
                <p className="text-gray-400 text-sm">Likes: {comment.likes}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-600">No comments yet.</p>
          )}
        </div>
      </div>
    );
}