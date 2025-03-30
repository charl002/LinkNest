"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react"; 
import { customToast } from "../ui/customToast";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import ChatList from "../chat/ChatList";
import Sidebar from "../custom-ui/Sidebar";

const CreatePost = () => {
    const router = useRouter();
    const {data: session } = useSession()
    const [title, setTitle] = useState("");
    const [text, setText] = useState("");
    const [hashtags, setHashtags] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [username, setUsername] = useState<string>("Anonymous");
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [progress, setProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [showChatList, setShowChatList] = useState(false);
  
    useEffect(() => {
        const fetchUsername = async () => {
            if (session?.user?.email) {
                try {
                    const response = await fetch(`/api/getsingleuser?email=${session.user.email}`);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const result = await response.json();
                    console.log("Fetched data:", result); 
                    setUsername(result.data.username || "Anonymous"); // Access username from result.data
                } catch (error) {
                    console.error("Error fetching username:", error);
                    setUsername("Anonymous"); 
                }
            }
        };

        fetchUsername();
    }, [session]);

    const uploadPost = async (formData: FormData) => {
        setProgress(20);
        const response = await fetch("/api/postuploadpost", {
            method: "POST",
            body: formData,
        });

        setProgress(80);
        const data = await response.json();
        return data;
    };

    const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
    const MAX_VIDEO_LENGTH = 38; // 38 seconds
    const validateVideoDuration = (file: File): Promise<boolean> => {
        return new Promise((resolve) => {
            const video = document.createElement("video");
            video.preload = "metadata";
            video.src = URL.createObjectURL(file);

            video.onloadedmetadata = () => {
                URL.revokeObjectURL(video.src);
                if (video.duration > MAX_VIDEO_LENGTH) {
                    customToast({ message: `Video must be less than ${MAX_VIDEO_LENGTH} seconds.`, type: "error" });
                    resolve(false);
                } else {
                    resolve(true);
                }
            };
        });
    };
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    
        if (!title || !text) {
            customToast({ message: "Title and description are required.", type: "error" });
            return;
        }

        if (text.length > 365) {
            customToast({ message: "Description cannot be longer than 365 charecters.", type: "error" });
            return;
        }

        if (title.length > 50) {
            customToast({ message: "Title cannot be longer than 50 characters long.", type: "error" });
            return;
        }
        
        if (hashtags.length > 1000) {
            customToast({ message: "All tags must be less than 1000 charecters long.", type: "error" });
            return;
        }

        let tooLong = false;
        hashtags.split(" ").forEach(tag => {
            if(tag.length > 20){
                customToast({ message: "Each tag should be less than 20 charecters long.", type: "error" });
                tooLong = true;
            }
        });

        if(tooLong){
            return;
        }

    //Image and Video restrictions    
        const allowedTypes = [
            "image/png", "image/jpeg", "image/jpg", 
            "video/mp4", "video/webm", "video/ogg"
        ];
    
        if (selectedFile && !allowedTypes.includes(selectedFile.type)) {
            customToast({ message: "Only PNG, JPG images or MP4, WEBM, OGG videos are allowed.", type: "error" });
            return;
        }

        if (selectedFile) {
            if (selectedFile.type.startsWith("image/") && selectedFile.size > MAX_IMAGE_SIZE) {
                customToast({ message: "Image size must be less than 5MB.", type: "error" });
                return;
            }
    
            if (selectedFile.type.startsWith("video/")) {
                const isValid = await validateVideoDuration(selectedFile);
                if (!isValid) return; // Stop if the video is too long
            }
        }

        const formData = new FormData();
        formData.append("username", username);
        formData.append("title", title);
        formData.append("text", text);
        hashtags.split(" ").forEach(tag => formData.append("tags", tag));
        if (selectedFile) {
            formData.append("file", selectedFile);
        }

        try {
            setIsUploading(true);
            setProgress(5);

            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 300);

            const result = await uploadPost(formData);

            clearInterval(progressInterval);

            if (result.postId){
                setProgress(100);
                customToast({ message: "Post uploaded successfully!", type: "success" });
                setTitle("");
                setText("");
                setHashtags("");
                setSelectedFile(null);

                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }

                setTimeout(() => {
                    setIsUploading(false);
                    router.push("/");
                }, 1500);

                } else {
                    customToast({ message: "Error uploading post. Please try again.", type: "error" });
                    setIsUploading(false);
                    setProgress(0);
                }
            } catch (error) {
                console.error("Error uploading post:", error);
                customToast({ message: "An unexpected error occurred. Please try again.", type: "error" });
                setIsUploading(false);
                setProgress(0);
            }    
    };

    const form = (
        <div className="bg-white shadow-md rounded-lg p-8 flex items-center justify-center flex-grow overflow-auto h-[calc(100vh-120px)]">
            <div className="w-full max-w-2xl bg-gray-200 shadow-lg rounded-lg p-10">
                <h1 className="text-3xl font-bold mb-6 text-center">Create a New Post</h1>
            
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                    <label className="block text-gray-700 font-semibold">Title:</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full py-3 px-4 border border-gray-300 rounded-lg"
                        required
                    />
                    </div>
            
                    <div>
                    <label className="block text-gray-700 font-semibold">Description:</label>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full py-3 px-4 border border-gray-300 rounded-lg"
                        required
                    />
                    </div>
            
                    <div>
                    <label className="block text-gray-700 font-semibold">Hashtags:</label>
                    <input
                        type="text"
                        value={hashtags}
                        onChange={(e) => setHashtags(e.target.value)}
                        className="w-full py-3 px-4 border border-gray-300 rounded-lg"
                        placeholder="#sports #coding"
                    />
                    </div>
            
                    <div className="w-full">
                        <label className="block text-gray-700 font-semibold mb-2">Upload Image/Video:</label>
                        <div 
                            className="border-2 border-dashed border-gray-400 bg-white rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-all flex flex-col items-center justify-center"
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={(e) => {
                                e.preventDefault();
                                setSelectedFile(e.dataTransfer.files[0]);
                            }}
                            onDragOver={(e) => e.preventDefault()}
                        >
                            {selectedFile ? (
                                <>
                                    {selectedFile.type.startsWith("image/") ? (
                                        <Image 
                                            src={URL.createObjectURL(selectedFile)} 
                                            alt="Preview"
                                            width={40} 
                                            height={40} 
                                            className="w-32 h-32 object-cover mx-auto rounded-md shadow-md"
                                        />
                                    ) : selectedFile.type.startsWith("video/") ? (
                                        <video
                                            controls
                                            className="w-40 h-40 object-cover rounded-md shadow-md"
                                        >
                                            <source src={URL.createObjectURL(selectedFile)} type={selectedFile.type} />
                                            Your browser does not support the video tag.
                                        </video>
                                    ) : (
                                        <p className="text-gray-600">{selectedFile.name}</p>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600">
                                        Click to Upload
                                    </div>
                                    <p className="text-gray-500 mt-2">or drag & drop here</p>
                                    <p className="text-xs text-gray-400">(PNG, JPG, MP4, WEBM supported)</p>
                                </>
                            )}
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/png, image/jpeg, image/jpg, video/mp4, video/webm, video/ogg"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            className="hidden"
                        />

                        {selectedFile && (
                            <div className="mt-3 flex justify-between items-center">
                                <p className="text-sm text-gray-500">{selectedFile.name}</p>
                                <button 
                                    type="button"
                                    className="text-red-500 text-sm font-medium hover:underline"
                                    onClick={() => setSelectedFile(null)}
                                >
                                    Remove
                                </button>
                            </div>
                        )}
                    </div>
            
                    {isUploading && (
                        <div className="mt-4">
                            <Progress value={progress} className="h-2 bg-gray-300" />
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-3 rounded-lg text-lg font-semibold hover:bg-blue-600"
                        disabled={isUploading}
                    >
                        Publish
                    </button>
                </form>        
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-100 text-gray-800">
            {/* Mobile View Toggle Buttons */}
            <div className="md:hidden flex justify-between p-4 gap-4">
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
    
            {/* Mobile View Content */}
            <div className="md:hidden min-h-screen overflow-y-auto px-4">
                {showSidebar && <Sidebar />}
                {showChatList && <ChatList />}
                {!showSidebar && !showChatList && form}
            </div>
    
            {/* Desktop Layout */}
            <div className="hidden md:grid grid-cols-[300px_1fr_300px] gap-6 p-6 h-[calc(100vh-4rem)] overflow-hidden">
                <div className="w-full max-h-[calc(100vh-3rem)] overflow-y-auto">
                <Sidebar />
                </div>
                <div className="h-full overflow-y-auto">{form}</div>
                <div className="w-full max-h-[calc(100vh-3rem)] overflow-y-auto">
                <ChatList />
                </div>
            </div>
        </div>
    );
};

export default CreatePost;