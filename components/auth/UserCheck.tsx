"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import ChatList from "@/components/chat/ChatList";
import Sidebar from "@/components/custom-ui/Sidebar";
import Post from "@/components/post/Post";
import { Toaster } from "sonner";
import LoadingLogo from "@/components/custom-ui/LoadingLogo";

import { PostType } from "@/types/post";
import { useInView } from 'react-intersection-observer';

export default function UserCheck() {
    const { data: session } = useSession();
    const [usernameRequired, setUsernameRequired] = useState(false);
    const [username, setUsername] = useState("");
    const [description, setDescription] = useState("");
    const [usernameError, setUsernameError] = useState("");
    const [posts, setPosts] = useState<PostType[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [sessionUsername, setSessionUsername] = useState('');
    const [activeTab, setActiveTab] = useState('user');
    const [allPosts, setAllPosts] = useState<PostType[]>([]);
    const [pageSize] = useState(5);
    const [currentPage, setCurrentPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const { ref, inView } = useInView({
        threshold: 0,
        rootMargin: '100px'
    });
    const scrollRef = useRef({ allPosts, currentPage, pageSize, hasMore, loadingPosts });
    const [showSidebar, setShowSidebar] = useState(false);
    const [showChatList, setShowChatList] = useState(false);

    useEffect(() => {
        if (!session?.user) return;

        const { email } = session.user;

        const fetchData = async () => {
            if (!email) {
                console.error("Email is required but was null or undefined.");
                return;
            }
        
            try {
                const response = await fetch(`/api/getsingleuser?email=${encodeURIComponent(email)}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
        
                if (response.status === 404) {
                    setUsernameRequired(true);
                } else if (response.ok) {
                    console.log("User already exists in the database");
                } else {
                    console.error("Failed to fetch user:", await response.json());
                }
            } catch (err) {
                console.error("Error checking user data:", err);
            }
        };
         
        fetchData();
    }, [session]);

    // useEffect(() => {
    //   if (!sessionUsername) return;

    //   async function fetchFriends() {
    //       try {
    //           const response = await fetch(`/api/getfriends?username=${sessionUsername}`);
    //           const data = await response.json();

    //           if (!response.ok) {
    //               console.error("Error fetching friends:", data);
    //               return;
    //           }

    //           const friendsData = await Promise.all(
    //               data.friends.map(async (friendUsername: string) => {
    //                   const userResponse = await fetch(`/api/getsingleuser?username=${friendUsername}`);
    //                   const userData = await userResponse.json();

    //                   return userResponse.ok ? { id: userData.id, ...userData.data } : null;
    //               })
    //           );

    //           setFriends(friendsData.filter(Boolean)); // Remove null values
    //       } catch (error) {
    //           console.error("Error fetching friends:", error);
    //       }
    //   }

    //   fetchFriends();
    // }, [sessionUsername, setFriends]); // Fetch friends when username is available

    useEffect(() => {
        if (!session?.user) return;

        const fetchInitialPosts = async () => {
            setLoadingPosts(true);
            const sessionEmail = session?.user?.email;
            const response = await fetch(`/api/getsingleuser?email=${sessionEmail}`);
            const sessionUser = await response.json();

            if (response.ok) {
                setSessionUsername(sessionUser.data.username)
            } 

            try {
                const [response, newsResponse, customResponse] = await Promise.all([
                    fetch('/api/bluesky/getfromdb'),
                    fetch('/api/news/getfromdb'),
                    fetch('/api/getuserpost')
                ]);
    
                const [data, newsData, customData] = await Promise.all([
                    response.json(),
                    newsResponse.json(),
                    customResponse.json()
                ]);
                
                let fetchedPosts: PostType[] = [];
                if (data.success) fetchedPosts = fetchedPosts.concat(data.posts);
                if (newsData.success) fetchedPosts = fetchedPosts.concat(newsData.posts);
                if (customData.success) fetchedPosts = fetchedPosts.concat(customData.posts);

                const sortedPosts = fetchedPosts.sort((a, b) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );

                setAllPosts(sortedPosts);
                setPosts(sortedPosts.slice(0, pageSize));
                setHasMore(sortedPosts.length > pageSize);
                setCurrentPage(0);
            } catch (err) {
                console.error("Error fetching posts:", err);
            } finally {
                setLoadingPosts(false);
            }
        };

        fetchInitialPosts();
    }, [session, pageSize]);

    const filterPosts = useCallback((posts: PostType[]) => {
        return posts.filter(post => {
            if (activeTab === 'user') return !['bluesky', 'news'].includes(post.postType);
            if (activeTab === 'bluesky') return post.postType === 'bluesky';
            if (activeTab === 'news') return post.postType === 'news';
            return true;
        });
    }, [activeTab]);

    // Effect for tab changes
    useEffect(() => {
        const filteredPosts = filterPosts(allPosts);
        setPosts(filteredPosts.slice(0, pageSize));
        setCurrentPage(0);
        setHasMore(filteredPosts.length > pageSize);
    }, [activeTab, allPosts, pageSize, filterPosts]);

    // Update ref when values change
    useEffect(() => {
        scrollRef.current = { allPosts, currentPage, pageSize, hasMore, loadingPosts };
    }, [allPosts, currentPage, pageSize, hasMore, loadingPosts]);

    // Simplified infinite scroll effect
    useEffect(() => {
        if (!inView || !scrollRef.current.hasMore || scrollRef.current.loadingPosts) return;
        
        const timer = setTimeout(() => {
            const filteredPosts = filterPosts(scrollRef.current.allPosts);
            const nextPage = scrollRef.current.currentPage + 1;
            const start = nextPage * scrollRef.current.pageSize;
            const end = start + scrollRef.current.pageSize;

            if (start < filteredPosts.length) {
                setPosts(prev => [...prev, ...filteredPosts.slice(start, end)]);
                setCurrentPage(nextPage);
                setHasMore(end < filteredPosts.length);
            } else {
                setHasMore(false);
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [inView, filterPosts]);

    const checkUsernameAvailability = async (username: string) => {
        if (!username) {
            console.error("Username is required but was empty.");
            return false;
        }
    
        try {
            const response = await fetch(`/api/getsingleuser?username=${encodeURIComponent(username)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
    
            if (response.status === 404) {
                return true;
            } else if (response.ok) {
                return false;
            } else {
                console.error("Failed to check username:", await response.json());
                return false;
            }
        } catch (err) {
            console.error("Error checking username availability:", err);
            return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!session?.user) return;

        const isUsernameAvailable = await checkUsernameAvailability(username);

        if (!isUsernameAvailable) {
            setUsernameError("Username is already taken. Please choose another one.");
            return;
        }

        if (username.length > 20 || username.length == 0){
            setUsernameError("Username should be between 1 and 20 charecters long.")
            return;
        }

        if (description.length > 350){
            setUsernameError("User desctiption should be less that 350 charecters long.")
            return;
        }

        const { email, name, image } = session!.user;

        try {
            const postResponse = await fetch('/api/postuser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, name, image, username, description }),
            });

            if (!postResponse.ok) {
                console.error("Failed to store user data in Firebase");
            } else {
                // Username has been submitted, hide the form
                setUsernameRequired(false);
            }
        } catch (err) {
            console.error("Error storing user data:", err);
        }
    };

    const mainContent =(
      <section className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
          <div className="flex space-x-2 mb-6">
              <button
                  onClick={() => setActiveTab('user')}
                  className={`flex-1 px-4 py-2 rounded-md transition-all ease-in-out duration-300 ${
                      activeTab === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 hover:bg-gray-300'
                  }`}
              >
                  Posts
              </button>
              <button
                  onClick={() => setActiveTab('bluesky')}
                  className={`flex-1 px-4 py-2 rounded-md transition-all ease-in-out duration-300 ${
                      activeTab === 'bluesky' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 hover:bg-gray-300'
                  }`}
              >
                  Bluesky
              </button>
              <button
                  onClick={() => setActiveTab('news')}
                  className={`flex-1 px-4 py-2 rounded-md transition-all ease-in-out duration-300 ${
                      activeTab === 'news' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-200 hover:bg-gray-300'
                  }`}
              >
                  News
              </button>
          </div>
          <div className="space-y-6 overflow-y-auto flex-1 h-[calc(100vh-120px)]">
              {posts.map((post, index) => (
                  <Post 
                      key={`${post.id}-${index}`} 
                      {...post} 
                      profilePicture={post.profilePicture || ""}
                      documentId={post.id}
                      postType={post.postType}
                      sessionUsername={sessionUsername}
                  />
              ))}
              <div ref={ref}>
                  {hasMore && <div className="text-center py-4">Loading more posts...</div>}
              </div>
          </div>
      </section>
    )

    if (usernameRequired) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-3xl font-bold mb-4 text-center">Setup Your Account</h2>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded mb-4"
                        required
                    />
                    {usernameError && (
                        <p className="text-red-500 text-sm mb-4">{usernameError}</p>
                    )}
                    <input
                        type="text"
                        placeholder="Description (Optional)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded mb-4"
                    />
                    <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
                        Submit
                    </button>
                </form>
            </div>
        );
    }

    if (loadingPosts) {
        return <LoadingLogo/>;
    }

    return (
      <div className="min-h-screen w-full text-gray-800">
      {/* Mobile Layout */}
      <div className="md:hidden p-4 space-y-4">
        <div className="flex justify-between gap-4">
          <button
            onClick={() => {
              setShowSidebar(prev => !prev);
              setShowChatList(false);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-md w-1/2"
          >
            {showSidebar ? "Close Sidebar" : "Sidebar"}
          </button>
          <button
            onClick={() => {
              setShowChatList(prev => !prev);
              setShowSidebar(false);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded-md w-1/2"
          >
            {showChatList ? "Close Friends" : "Friends"}
          </button>
        </div>
  
        <div className="md:hidden min-h-screen overflow-y-auto px-4">
          {showSidebar && <Sidebar />}
          {showChatList && <ChatList />}
          {!showSidebar && !showChatList && mainContent}
        </div>
      </div>
  
      {/* Desktop Layout */}
      <div className="hidden md:grid grid-cols-[300px_1fr_300px] gap-6 p-6 w-full h-screen">
        <div className="w-full max-h-[calc(100vh-3rem)] overflow-y-auto">
          <Sidebar />
        </div>
        {mainContent}
        <div className="w-full max-h-[calc(100vh-3rem)] overflow-y-auto">
          <ChatList />
        </div>
      </div>
  
      <Toaster position="bottom-center" richColors />
    </div>
    );
}