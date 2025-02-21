"use-client";
import { useState } from "react";
import { useSession } from "next-auth/react"; 

const CreatePost = () => {
    const {data: session } = useSession()
    const [title, setTitle] = useState("");
    const [text, setText] = useState("");
    const [hashtags, setHashtags] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [message, setMessage] = useState("");
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const uploadPost = async (formData: FormData) => {
        const response = await fetch("api/postuploadpost", {
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

    }
}
