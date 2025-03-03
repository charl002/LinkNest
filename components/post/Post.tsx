import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface PostProps {
    title: string;
    username: string;
    description: string;
    tags: string[];
    comments: { comment: string; username: string; date: string; likes: number }[];
    likes: number;
    images: { url: string; alt: string; thumb: string }[];
    profilePicture: string;
    documentId: string;
    postType: 'posts' | 'bluesky' | 'news';
    likedBy: string[];
}

interface Comment {
  username: string;
  comment: string;
  date: string;
  likes: number;
}

export default function Post({ title, username, description, tags, comments, likes, images, profilePicture, documentId, postType, likedBy }: PostProps) {
    const { data: session } = useSession();
    const [likeCount, setLikeCount] = useState(likes);
    const [isLiked, setIsLiked] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [postComments, setPostComments] = useState<Comment[]>(comments);
    const [sessionUsername, setSessionUsername] = useState('');

    useEffect(() => {
        const fetchSessionUsername = async () => {
            if (!session?.user) return;
            const sessionEmail = session.user.email;

            const response = await fetch(`/api/getsingleuser?email=${sessionEmail}`);
            const sessionUser = await response.json();

            if (response.ok) {
                const username = sessionUser.data.username;
                setSessionUsername(username);
                setIsLiked(likedBy.includes(username));
            } else {
                console.error(sessionUser.message);
            }
        };

        fetchSessionUsername();
    }, [session, likedBy]);

    const handleToggleLike = async () => {
        if (!session?.user || !sessionUsername) return;

        const newIsLiked = !isLiked;
        const incrementValue = newIsLiked;

        try {
            const response = await fetch('/api/putlikes', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: documentId, type: postType, increment: incrementValue, username: sessionUsername })
            });

            const data = await response.json();
            if (response.ok) {
                setLikeCount(prevCount => newIsLiked ? prevCount + 1 : prevCount - 1);
                setIsLiked(newIsLiked);
            } else {
                console.error(data.message);
            }
        } catch (error) {
            console.error('Error liking the post:', error);
        }
    };

    const handlePostComment = async () => {
      if (!session?.user || !sessionUsername || !newComment.trim()) return;

      try {
          const response = await fetch('/api/postcomment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ postId: documentId, username: sessionUsername, comment: newComment })
          });

          const data = await response.json();
          if (response.ok) {
            // Convert "Just now" to the actual timestamp for previous comments
            const updatedComments = postComments.map(comment =>
              comment.date === "Just now"
                ? { ...comment, date: new Date().toLocaleString() }
                : comment
            );
  
            setPostComments([
              ...updatedComments,
              { username: sessionUsername, comment: newComment, date: "Just now", likes: 0 }
            ]);
  
            setNewComment(""); 
          } else {
            console.error(data.message);
          }
      } catch (error) {
          console.error('Error posting comment:', error);
      }
  };


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
          <span className="text-gray-600">{likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>
          <button 
            onClick={handleToggleLike} 
            className={`ml-4 px-3 py-1 rounded transition ${isLiked ? 'bg-blue-600 text-white' : 'bg-gray-300 text-black'}`}
          >
            {isLiked ? 'Unlike' : 'Like'}
          </button>
        </div>
          <div className="mt-4">
            <h3 className="font-semibold">Comments</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {postComments.length > 0 ? (
                postComments.map((comment, index) => (
                  <div key={index} className="bg-gray-100 p-3 rounded-md">
                    <p><strong>{comment.username}:</strong> {comment.comment}</p>
                    <p className="text-gray-400 text-xs">{comment.date}</p>
                  </div>
                ))
              ) : (
                  <p className="text-gray-600">No comments yet.</p>
              )}
            </div>

            <div className="mt-3 flex items-center space-x-2">
              <input 
                  type="text" 
                  value={newComment} 
                  onChange={(e) => setNewComment(e.target.value)} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Write a comment..."
              />
              <button onClick={handlePostComment} className="bg-blue-500 text-white px-3 py-2 rounded-lg">
                  Post
              </button>
            </div>
          </div>
        </div>
    );
}