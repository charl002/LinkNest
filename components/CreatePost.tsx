"use client";

import { useState, useRef, useEffect } from "react";
// import Image from "next/image";
import { useSession } from "next-auth/react"; 

const CreatePost = () => {
    const {data: session } = useSession()
    const [title, setTitle] = useState("");
    const [text, setText] = useState("");
    const [hashtags, setHashtags] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [message, setMessage] = useState("");
    const [username, setUsername] = useState<string>("Anonymous");
    // const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

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
        const response = await fetch("/api/postuploadpost", {
            method: "POST",
            body: formData,
        });

        const data = await response.json();
        return data;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    
        if (!title || !text) {
            setMessage("Title and description are required.");
            return;
        }
        
        const allowedTypes = [
            "image/png", "image/jpeg", "image/jpg", 
            "video/mp4", "video/webm", "video/ogg"
        ];
    
        if (selectedFile && !allowedTypes.includes(selectedFile.type)) {
            setMessage("Only PNG, JPG images or MP4, WEBM, OGG videos are allowed.");
            return;
        }

        const formData = new FormData();
        formData.append("username", username);
        formData.append("title", title);
        formData.append("text", text);
        hashtags.split(" ").forEach(tag => formData.append("tags", tag));

        if (selectedFile) {
            formData.append("file", selectedFile);
        }

        const result = await uploadPost(formData);

        if (result.postId){
            setMessage("Post uploaded successfully")
            // setUploadedImageUrl(result.fileUrl);
            setTitle("");
            setText("");
            setHashtags("");
            setSelectedFile(null);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            } else {
            setMessage("Error uploading post. Please try again.");
            }
    };

    return (
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
        
                <div>
                <label className="block text-gray-700 font-semibold">Upload Image/Video:</label>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full py-3 px-4 border border-gray-300 rounded-lg"
                />
                </div>
        
                <button
                type="submit"
                className="w-full bg-blue-500 text-white py-3 rounded-lg text-lg font-semibold hover:bg-blue-600"
                >
                Publish
                </button>
            </form>
        
            {message && <p className="mt-6 text-center text-red-500 text-lg">{message}</p>}
        </div>
    );
};

export default CreatePost;