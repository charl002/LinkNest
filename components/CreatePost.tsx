"use client";

import { useState, useRef, useEffect } from "react";
// import Image from "next/image";
import { useSession } from "next-auth/react"; 
import { customToast } from "./ui/customToast";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";

const CreatePost = () => {
    const router = useRouter();
    const {data: session } = useSession()
    const [title, setTitle] = useState("");
    const [text, setText] = useState("");
    const [hashtags, setHashtags] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [username, setUsername] = useState<string>("Anonymous");
    // const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [progress, setProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    
        if (!title || !text) {
            customToast({ message: "Title and description are required.", type: "error" });
            return;
        }
        
        const allowedTypes = [
            "image/png", "image/jpeg", "image/jpg", 
            "video/mp4", "video/webm", "video/ogg"
        ];
    
        if (selectedFile && !allowedTypes.includes(selectedFile.type)) {
            customToast({ message: "Only PNG, JPG images or MP4, WEBM, OGG videos are allowed.", type: "error" });
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
                // setUploadedImageUrl(result.fileUrl); 
                setTitle("");
                setText("");
                setHashtags("");
                setSelectedFile(null);

                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }

                setTimeout(() => {
                    setIsUploading(false);
                    router.push("/home");
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
    );
};

export default CreatePost;