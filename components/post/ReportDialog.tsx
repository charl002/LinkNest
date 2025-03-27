"use client";

import { useState } from "react";
import { toast } from "sonner";

interface ReportDialogProps {
    postId: string;
    username: string;
    onClose: () => void;
}

export default function ReportDialog({ postId, username, onClose }: ReportDialogProps) {
    const [reason, setReason] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch("/api/reportpost", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    postId,
                    reportedBy: username,
                    reason,
                }),
            });

            if (response.ok) {
                toast.success("Post reported successfully");
                onClose();
            } else {
                const data = await response.json();
                toast.error(data.message || "Failed to report post");
            }
        } catch (error) {
            toast.error("Error reporting post");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full">
                <h2 className="text-xl font-bold mb-4">Report Post</h2>
                <form onSubmit={handleSubmit}>
                    <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Why are you reporting this post?"
                        className="w-full p-2 border rounded mb-4 min-h-[100px]"
                        required
                    />
                    <div className="flex justify-end space-x-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                            Submit Report
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}