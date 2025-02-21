"use client";

import { useState, useRef } from "react";
// import Image from "next/image";
import { useSession } from "next-auth/react"; 

const CreatePost = () => {
    const {data: session } = useSession()
    const [title, setTitle] = useState("");
    const [text, setText] = useState("");
    const [hashtags, setHashtags] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [message, setMessage] = useState("");
    // const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

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
        
        if (!selectedFile) {
            setMessage("Please select an image or video.");
            return;
        }
    
        const allowedTypes = [
            "image/png", "image/jpeg", "image/jpg", 
            "video/mp4", "video/webm", "video/ogg"
        ];
        
        if (!allowedTypes.includes(selectedFile.type)) {
            setMessage("Only PNG, JPG images or MP4, WEBM, OGG videos are allowed.");
            return;
        }

        const formData = new FormData();
        formData.append("username", session?.user?.name || "Anonymous");
        formData.append("title", title);
        formData.append("text", text);
        hashtags.split(" ").forEach(tag => formData.append("tags", tag));
        formData.append("file", selectedFile);

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
            <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-md">
              <h1 className="text-2xl font-bold mb-4">Create a Post</h1>
        
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700">Title:</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    required
                  />
                </div>
        
                <div>
                  <label className="block text-gray-700">Description:</label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    required
                  />
                </div>
        
                <div>
                  <label className="block text-gray-700">Hashtags:</label>
                  <input
                    type="text"
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="#sports #coding"
                  />
                </div>
        
                <div>
                  <label className="block text-gray-700">Upload Image/Video:</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
        
                <button
                  type="submit"
                  className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                >
                  Publish
                </button>
              </form>
        
              {message && <p className="mt-4 text-center text-red-500">{message}</p>}
            </div>
          );
        };

export default CreatePost;