import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FiThumbsUp } from 'react-icons/fi'; 
import { BiReply } from 'react-icons/bi';
import { IoSend } from "react-icons/io5";
import { FaRegThumbsUp, FaThumbsUp, FaRegComment } from "react-icons/fa";

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
    const [showComments, setShowComments] = useState(false); 

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
        <div className="mt-4 flex items-center space-x-6">
          <button
            onClick={handleToggleLike}
            className={`flex items-center space-x-2 px-3 py-1 rounded-md transition text-sm 
                ${isLiked ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'} hover:bg-blue-200`}
          >
            {isLiked ? <FaThumbsUp className="text-blue-600" /> : <FaRegThumbsUp />} 
            <span>{likeCount} {likeCount === 1 ? 'Like' : 'Likes'}</span>
          </button>

          <button
            onClick={() => setShowComments(true)}
            className="flex items-center space-x-2 px-3 py-1 rounded-md transition bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            <FaRegComment />
            <span>Comment</span>
          </button>
        </div>
        
        {showComments && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70">
            <div className="bg-white text-gray-900 p-6 rounded-lg shadow-lg w-[500px] max-h-[600px] overflow-y-auto relative">
             
              <button
                  onClick={() => setShowComments(false)}
                  className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-xl"
              >
                  X
              </button>

              <h3 className="text-lg font-semibold mb-4">Comments</h3>

              <div className="space-y-4">
                {postComments.length > 0 ? (
                  postComments.map((comment, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <Image
                        src="/defaultProfilePic.jpg"
                        alt={comment.username}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      <div>
                        <p className="font-bold text-sm text-gray-900">{comment.username} <span className="text-gray-500 text-xs">{comment.date}</span></p>
                        <p className="text-gray-700">{comment.comment}</p>
                        <div className="flex items-center space-x-3 mt-1 text-gray-500 text-sm">
                          <button className="flex items-center space-x-1 hover:text-gray-700">
                            <FiThumbsUp /> <span>{comment.likes}</span>
                          </button>
                          <button className="flex items-center space-x-1 hover:text-gray-700">
                            <BiReply /> <span>Reply</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                    <p className="text-gray-500">No comments yet.</p>
                )}
              </div>

              <div className="mt-3 flex items-center space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500"
                  placeholder="Write a comment..."
                />
                <button onClick={handlePostComment} className="px-4 py-2 hover:text-gray-500 transition">
                  <IoSend className="inline-block text-xl" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
}