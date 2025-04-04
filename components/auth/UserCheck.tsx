"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import ChatList from "@/components/chat/ChatList";
import Sidebar from "@/components/custom-ui/Sidebar";
import Post from "@/components/post/Post";
import { Toaster } from "sonner";
import LoadingLogo from "@/components/custom-ui/LoadingLogo";
import { getUserByEmail, getUserByUsername, getAllPosts, submitUser } from "@/app/actions";
import { PostType } from "@/types/post";
import { useInView } from 'react-intersection-observer';

/**
 * The UserCheck component is responsible for managing the user's session, checking username availability, and displaying posts.
 * It handles the fetching of user data, post data, and displays the content based on user actions such as liking or commenting.
 * 
 * @returns {JSX.Element} The rendered UserCheck component.
 */
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
    const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

    /**
     * Fetches user data when the session exists and checks if the username is required.
     * It also checks if the user is banned and handles blocked users.
     */
    useEffect(() => {
        if (!session?.user) return;

        const { email } = session.user;

        const fetchData = async () => {
            if (!email) {
                console.error("Email is required but was null or undefined.");
                return;
            }
        
            try {
                const userData = await getUserByEmail(email);
                if (userData.status === 404) {
                    setUsernameRequired(true);
                } else {
                    if (userData.data?.isBanned) {
                        window.location.href = '/banned';
                        return;
                    }
                    setBlockedUsers(userData.data.blockedUsers || []);
                }
            } catch (err) {
                console.error("Error checking user data:", err);
            }
        };
         
        fetchData();
    }, [session]);

    /**
     * Fetches initial posts for the user, including posts from different categories.
     * Sorts the posts by creation date and prepares the data for display..
     */
    const fetchInitialPosts = useCallback(async () => {
        if (!session?.user?.email) return;
        
        setLoadingPosts(true);
        try {
            const sessionUser = await getUserByEmail(session.user.email);
            if (sessionUser.status !== 404) {
                setSessionUsername(sessionUser.data.username);
                setBlockedUsers(sessionUser.data.blockedUsers || []);
            }

            const fetchedPosts = await getAllPosts();
            const sortedPosts = fetchedPosts.sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() // Sort posts by creation date
            );

            setAllPosts(sortedPosts); // Set all posts
            setPosts(sortedPosts.slice(0, pageSize)); // Paginate the first set of posts
            setHasMore(sortedPosts.length > pageSize);
            setCurrentPage(0);
        } catch (err) {
            console.error("Error fetching posts:", err);
        } finally {
            setLoadingPosts(false);
        }
    }, [session, pageSize]);

     /**
     * Filters posts based on blocked users and the active tab ('user', 'bluesky', or 'news').
     * 
     * @param {PostType[]} posts - The posts to filter.
     * @returns {PostType[]} - The filtered posts.
     */
    const filterPosts = useCallback((posts: PostType[]) => {
        return posts.filter(post => {
            if (blockedUsers.includes(post.username)) return false;
            
            if (activeTab === 'user') return !['bluesky', 'news'].includes(post.postType);
            if (activeTab === 'bluesky') return post.postType === 'bluesky';
            if (activeTab === 'news') return post.postType === 'news';
            return true;
        });
    }, [activeTab, blockedUsers]);

    /**
     * Fetches posts whenever the session or initial data is loaded.
     */
    useEffect(() => {
        if (!session?.user) return;
        fetchInitialPosts();
    }, [session, fetchInitialPosts]);

    /**
     * Filters posts whenever the active tab or all posts change.
     */
    useEffect(() => {
        const filteredPosts = filterPosts(allPosts);
        setPosts(filteredPosts.slice(0, pageSize)); // Set filtered posts and reset to page 0
        setCurrentPage(0);
        setHasMore(filteredPosts.length > pageSize);
    }, [activeTab, allPosts, pageSize, filterPosts]);

    /**
     * Keeps track of the current state and paginated data for posts.
     */
    useEffect(() => {
        scrollRef.current = { allPosts, currentPage, pageSize, hasMore, loadingPosts };
    }, [allPosts, currentPage, pageSize, hasMore, loadingPosts]);

    /**
     * Handles the infinite scroll behavior by checking if more posts are available and loading them.
     */
    useEffect(() => {
        if (!inView || !scrollRef.current.hasMore || scrollRef.current.loadingPosts) return;
        
        const timer = setTimeout(() => {
            const filteredPosts = filterPosts(scrollRef.current.allPosts);
            const nextPage = scrollRef.current.currentPage + 1;
            const start = nextPage * scrollRef.current.pageSize;
            const end = start + scrollRef.current.pageSize;

            if (start < filteredPosts.length) {
                setPosts(prev => [...prev, ...filteredPosts.slice(start, end)]); // Append new posts
                setCurrentPage(nextPage); // Update current page
                setHasMore(end < filteredPosts.length); // Check if there are more posts
            } else {
                setHasMore(false);
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [inView, filterPosts]);

    /**
     * Checks if the username is available by making a request to the API.
     * 
     * @param {string} username - The username to check.
     * @returns {Promise<boolean>} - Returns true if the username is available, otherwise false.
     */
    const checkUsernameAvailability = async (username: string) => {
        if (!username) {
            console.error("Username is required but was empty.");
            return false;
        }
    
        try {
            const user = await getUserByUsername(username);
            return user === null;
        } catch (err) {
            console.error("Error checking username availability:", err);
            return false;
        }
    };

    /**
     * Handles the submission of the username and description form.
     * It validates the input fields and stores the user data if valid.
     */
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!session?.user?.email || !session.user.name || !session.user.image) {
            console.error("Required user data is missing");
            return;
        }

        const isUsernameAvailable = await checkUsernameAvailability(username);

        if (!isUsernameAvailable) {
            setUsernameError("Username is already taken. Please choose another one.");
            return;
        }

        if (username.length > 20 || username.length == 0) {
            setUsernameError("Username should be between 1 and 20 charecters long.")
            return;
        }

        if (description.length > 350) {
            setUsernameError("User desctiption should be less that 350 charecters long.")
            return;
        }

        try {
            const success = await submitUser({
                email: session.user.email,
                name: session.user.name,
                image: session.user.image,
                username,
                description
            });
            
            if (!success) {
                console.error("Failed to store user data in Firebase");
            } else {
                setUsernameRequired(false);
            }
        } catch (err) {
            console.error("Error storing user data:", err);
        }
    };

    /**
     * Displays the account setup form if the username is required.
     * 
     * @returns {JSX.Element} The rendered form for setting up the account.
     */
    const mainContent = (
        <section className="flex flex-col h-[calc(100vh-120px)] overflow-hidden">
            <div className="flex space-x-2 mb-6">
            {/* Tabs for displaying posts, bluesky, and news */}
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
                {/* Render posts based on active tab */}
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
    );

    /**
     * Renders the form to setup a new account if the username is not yet set.
     */
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
        return <LoadingLogo />; // Show the loading logo while posts are being fetched
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