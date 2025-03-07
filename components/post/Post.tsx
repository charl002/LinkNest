import Image from 'next/image';
import Link from "next/link";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FiThumbsUp } from 'react-icons/fi'; 
import { BiReply } from 'react-icons/bi';
import { IoSend } from "react-icons/io5";
import { FaRegThumbsUp, FaThumbsUp, FaRegComment } from "react-icons/fa";

interface Comment {
    username: string;
    comment: string;
    date: string;
    likes: number;
    likedBy: string[];
}

interface PostProps {
    title: string;
    username: string;
    description: string;
    tags: string[];
    comments: Comment[];  // Using the Comment interface
    likes: number;
    images: { url: string; alt: string; thumb: string }[];
    profilePicture: string;
    documentId: string;
    postType: 'posts' | 'bluesky' | 'news';
    likedBy: string[];
    sessionUsername: string;
}

export default function Post({ title, username, description, tags, comments, likes, images, profilePicture, documentId, postType, likedBy, sessionUsername }: PostProps) {
    const { data: session } = useSession();
    const [likeCount, setLikeCount] = useState(likes);
    const [isLiked, setIsLiked] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [postComments, setPostComments] = useState<Comment[]>(comments);
    const [showComments, setShowComments] = useState(false); 
    const [isLoading, setIsLoading] = useState(false);
    const [isOverLimit, setIsOverLimit] = useState(false);

    useEffect(() => {
        const fetchSessionUsername = async () => {
            if (!session?.user) return;
            setIsLiked(likedBy.includes(sessionUsername));
        };

        fetchSessionUsername();
    }, [session, likedBy, sessionUsername]);

    const handleToggleLike = async () => {
        if (!session?.user || !sessionUsername || isLoading) return;

        setIsLoading(true);
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
        } finally {
            setIsLoading(false);
        }
    };

    const handlePostComment = async () => {
        if (!session?.user || !sessionUsername || !newComment.trim()) return;

        try {
            const response = await fetch('/api/postcomment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postType: postType, postId: documentId, username: sessionUsername, comment: newComment })
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
                    { 
                        username: sessionUsername, 
                        comment: newComment, 
                        date: "Just now", 
                        likes: 0, 
                        likedBy: [] // Initialize with empty array
                    }
                ]);
  
                setNewComment(""); 
            } else {
                console.error(data.message);
            }
        } catch (error) {
            console.error('Error posting comment:', error);
        }
    };

    const handleReply = (username: string) => {
        setNewComment(`@${username} `);
        // Focus on the input field
        const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
        if (inputElement) {
            inputElement.focus();
        }
    };

    const handleCommentLike = async (commentIndex: number, isLiked: boolean) => {
        if (!session?.user || !sessionUsername || isLoading) return;
  
        setIsLoading(true);
        const incrementValue = !isLiked;
  
        try {
            const response = await fetch('/api/putcommentlikes', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: documentId,
                    type: postType,
                    increment: incrementValue,
                    username: sessionUsername,
                    commentIndex
                })
            });
  
            const data = await response.json();
            if (response.ok) {
                setPostComments(prevComments => prevComments.map((comment, idx) => {
                    if (idx === commentIndex) {
                        return {
                            ...comment,
                            likes: incrementValue ? comment.likes + 1 : comment.likes - 1,
                            likedBy: incrementValue 
                                ? [...comment.likedBy, sessionUsername]
                                : comment.likedBy.filter(user => user !== sessionUsername)
                        };
                    }
                    return comment;
                }));
            } else {
                console.error(data.message);
            }
        } catch (error) {
            console.error('Error liking the comment:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        setIsOverLimit(input.length > 100);
        setNewComment(input);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !isOverLimit && newComment.trim()) {
            handlePostComment();
        }
    };

    const defaultImageUrl = "/defaultProfilePic.jpg";

    return (
      <div className="bg-white shadow-md p-4 rounded-md">
        <Link href={`/profile/${encodeURIComponent(username)}`}>
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
        </Link>
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
            disabled={isLoading}
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
                        className="rounded-full flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-gray-900">{comment.username} <span className="text-gray-500 text-xs">{comment.date}</span></p>
                        <p className="text-gray-700 break-words overflow-wrap-anywhere">{comment.comment}</p>
                        <div className="flex items-center space-x-3 mt-1 text-gray-500 text-sm">
                            <button 
                                onClick={() => handleCommentLike(index, comment.likedBy.includes(sessionUsername))}
                                className={`flex items-center space-x-1 hover:text-gray-700 ${
                                    comment.likedBy.includes(sessionUsername) ? 'text-blue-600' : ''
                                }`}
                                disabled={isLoading}
                            >
                                {comment.likedBy.includes(sessionUsername) ? 
                                    <FaThumbsUp /> : 
                                    <FiThumbsUp />
                                }
                                <span>{comment.likes}</span>
                            </button>
                            <button 
                                onClick={() => handleReply(comment.username)}
                                className="flex items-center space-x-1 hover:text-gray-700"
                            >
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
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newComment}
                    onChange={handleCommentChange}
                    onKeyPress={handleKeyPress}
                    className={`w-full px-3 py-2 border rounded-lg bg-white text-gray-900 placeholder-gray-500
                      ${isOverLimit ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    placeholder="Write a comment... (100 characters max)"
                  />
                  {isOverLimit && (
                    <p className="text-red-500 text-xs mt-1 absolute">
                      Comment must be 100 characters or less ({newComment.length}/100)
                    </p>
                  )}
                </div>
                <button 
                  onClick={handlePostComment} 
                  disabled={isOverLimit || !newComment.trim()}
                  className={`px-4 py-2 transition ${
                    isOverLimit || !newComment.trim() 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'hover:text-gray-500'
                  }`}
                >
                  <IoSend className="inline-block text-xl" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
}