import Image from 'next/image';
import Link from "next/link";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FiThumbsUp } from 'react-icons/fi'; 
import { BiReply } from 'react-icons/bi';
import { IoSend } from "react-icons/io5";
import { FaRegThumbsUp, FaThumbsUp, FaRegComment } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Comment } from "@/types/comment";
import { Trash2 } from 'lucide-react';
import { customToast } from "@/components/ui/customToast";
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,} from "@/components/ui/alert-dialog"
import { useInView } from 'react-intersection-observer';
import ReportDialog from "./ReportDialog";
import { useRouter } from "next/navigation";

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
    const { ref, inView } = useInView({
        threshold: 0.1,
        triggerOnce: true
    });
    const { data: session } = useSession();
    const [likeCount, setLikeCount] = useState(likes);
    const [isLiked, setIsLiked] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [postComments, setPostComments] = useState<Comment[]>(comments);
    const [isLoading, setIsLoading] = useState(false);
    const [isOverLimit, setIsOverLimit] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    const [showReportDialog, setShowReportDialog] = useState(false);

    useEffect(() => {
        const fetchSessionUsername = async () => {
            if (!session?.user) return;
            setIsLiked(likedBy.includes(sessionUsername));
        };

        fetchSessionUsername();
    }, [session, likedBy, sessionUsername]);

    
    
    // Fetch profile pictures for comments
    const fetchProfilePictures = async (comments: Comment[]) => {
      const updatedComments = await Promise.all(
          comments.map(async (comment) => {
              if (!comment.profilePicture || comment.profilePicture === "/defaultProfilePic.jpg") {
                  try {
                      const response = await fetch(`/api/getsingleuser?username=${comment.username}`);
                      if (!response.ok) throw new Error("Failed to fetch profile picture");

                      const userData = await response.json();
                      return {
                          ...comment,
                          profilePicture: userData.data.image || "/defaultProfilePic.jpg",
                      };
                  } catch (error) {
                      console.error("Error fetching profile picture:", error);
                      return { ...comment, profilePicture: "/defaultProfilePic.jpg" };
                  }
              }
              return comment;
          })
      );
      return updatedComments;
  };    

    const router = useRouter();
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
                router.refresh();
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
  
            // Add the new comment with a temporary profile picture
            const newCommentData = { 
              username: sessionUsername, 
              comment: newComment, 
              date: "Just now", 
              likes: 0, 
              likedBy: [],
              profilePicture: "/defaultProfilePic.jpg" // Temporary placeholder
          };

          setPostComments([...updatedComments, newCommentData]);

          // Fetch profile pictures for all comments (including the new one)
          const updatedCommentsWithProfilePictures = await fetchProfilePictures([...updatedComments, newCommentData]);
          setPostComments(updatedCommentsWithProfilePictures);
          router.refresh();
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
            router.refresh();
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

    const handleDeleteComment = async (comment: Comment) => {
    console.log(comment);
    setIsLoading(true);

    try {
      const response = await fetch("/api/deletecomment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId: documentId,
          username: comment.username,
          comment: comment.comment,
          date: comment.date,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Remove the deleted comment from the UI
        const updatedComments = postComments.filter(
          (c) =>
            c.username !== comment.username ||
            c.comment !== comment.comment ||
            c.date !== comment.date
        );
        setPostComments(updatedComments); 
        customToast({ message: `Comment has successfully been removed!`, type: "success" });
      }
      else {
        customToast({ message: `${result.message}`, type: "error" });
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      customToast({ message: "An unexpected error occurred. Please try again.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch("/api/deletepost", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: documentId, postType: "posts" }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete post");
      }

      const data = await response.json();
      console.log(data.message);
      customToast({ message: `Post has been deleted`, type: "success" });

    } catch (error) {
      console.error("Error deleting post:", error);
      customToast({ message: "An unexpected error occurred. Please try again.", type: "error" });
    }
  };

    if (!inView) {
        return <div ref={ref} className="h-[300px] bg-gray-100 animate-pulse rounded-md" />;
    }

    return (
      <div ref={ref} className="bg-white shadow-md p-4 rounded-md">
          <div className="flex items-center justify-between w-full">
          <Link href={`/profile/${encodeURIComponent(username)}`}>
            <div className="flex items-center space-x-2 transition-transform duration-200 hover:scale-110 active:scale-90">
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
            {sessionUsername === username && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button onClick={(e) => e.stopPropagation()} className="transition-transform duration-200 hover:scale-110 active:scale-90">
                    <Trash2/>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your post from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

        {images.length > 0 && images[0].url ? (
          <div className="mt-4 relative w-full overflow-hidden bg-transparent rounded-md group">
            {images[0].url.match(/\.(mp4|webm|ogg)$/) ? (
              <div className="relative w-full h-0" style={{ paddingTop: '56.25%' }}>
                <video 
                    controls 
                    className="absolute inset-0 w-full h-full object-contain"
                    src={images[0].url}
                >
                    Your browser does not support the video tag.
                </video>
              </div>
            ) : (
              <button onClick={() => setIsZoomed(true)} className="relative w-full h-0" style={{ paddingTop: '56.25%' }}>
                <Image 
                  src={images[0].url} 
                  alt={images[0].alt} 
                  fill
                  priority
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </button>
            )}
          </div>
        ) : null}

      {/* Zoom  media*/}
        <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-transparent border-none">
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 z-50 p-2 bg-white rounded-full hover:bg-gray-200"
            >
              X
            </button>
            <DialogHeader>
              <DialogTitle className="sr-only">Media Preview</DialogTitle>
            </DialogHeader>
            <div className="relative w-full h-[90vh] flex items-center justify-center">
              {images.length > 0 && images[0].url && (
                images[0].url.match(/\.(mp4|webm|ogg)$/) ? (
                  <video 
                    controls 
                    className="max-w-full max-h-full object-contain"
                    src={images[0].url}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="relative w-full h-full">
                    <Image 
                      src={images[0].url} 
                      alt={images[0].alt} 
                      fill
                      priority
                      className="object-contain"
                      sizes="100vw"
                    />
                  </div>
                )
              )}
            </div>
          </DialogContent>
        </Dialog>

        <p className="mt-2 font-semibold">{title}</p>
        <p className="text-gray-500">{description}</p>
        <p className="text-blue-500 text-sm mt-2">{tags.join(' ')}</p>
        <div className="mt-4 flex items-center space-x-6">
          <button
            onClick={handleToggleLike}
            className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm transition-transform duration-200 hover:scale-105 active:scale-95 
                ${isLiked ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'} hover:bg-blue-200`}
            disabled={isLoading}
          >
            {isLiked ? <FaThumbsUp className="text-blue-600" /> : <FaRegThumbsUp />} 
            <span>{likeCount} {likeCount === 1 ? 'Like' : 'Likes'}</span>
          </button>

          <Dialog onOpenChange={(isOpen) => {
              if (isOpen && comments.length > 0) {
                  fetchProfilePictures(comments).then(setPostComments);
              }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center bg-gray-100 text-gray-600 space-x-2 px-3 py-1 rounded-md transition-transform duration-200 hover:scale-105 active:scale-95">
                <FaRegComment />
                <span>Comment</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Comments</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {postComments.length > 0 ? (
                  postComments.map((comment, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                      <Link key={index} href={`/profile/${encodeURIComponent(comment.username)}`}>
                        <Image
                          src={comment.profilePicture || defaultImageUrl}
                          alt={comment.username}
                          width={40}
                          height={40}
                          className="rounded-full flex-shrink-0 transition-transform duration-200 hover:scale-105 active:scale-95"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                      <Link key={index} href={`/profile/${encodeURIComponent(comment.username)}`}>
                        <p className="font-bold text-sm text-gray-900 transition-transform duration-200 hover:scale-105 active:scale-95">
                          {comment.username} <span className="text-gray-500 text-xs">{comment.date}</span>
                        </p>
                      </Link>
                        {sessionUsername === comment.username && (
                          <button className="transition-transform duration-200 hover:scale-110 active:scale-90" onClick={() => handleDeleteComment(comment)}
                          disabled={isLoading}>
                            <Trash2 />
                          </button>
                        )}
                      </div>
                        <p className="text-gray-700 break-words whitespace-pre-wrap">{comment.comment}</p>
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
                  <Input
                    type="text"
                    value={newComment}
                    onChange={handleCommentChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Write a comment... (100 characters max)"
                  />
                  {isOverLimit && (
                    <p className="text-red-500 text-xs mt-1 absolute">
                      Comment must be 100 characters or less ({newComment.length}/100)
                    </p>
                  )}
                </div>
                <Button 
                  onClick={handlePostComment} 
                  disabled={isOverLimit || !newComment.trim()}
                >
                  <IoSend className="inline-block text-xl" />
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <button
            onClick={() => setShowReportDialog(true)}
            className="text-gray-400 hover:text-red-500 text-sm transition-colors duration-200"
          >
            Report
          </button>
        </div>
        {showReportDialog && (
          <ReportDialog
              postId={documentId}
              username={sessionUsername}
              postType={postType}
              onClose={() => setShowReportDialog(false)}
          />
      )}
      </div>
    );}
