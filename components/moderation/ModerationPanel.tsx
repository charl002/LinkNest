"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import LoadingLogo from "@/components/custom-ui/LoadingLogo";

interface Report {
    reportedBy: string;
    reason: string;
    timestamp: string;
}

interface ReportedPost {
    id: string;
    title: string;
    description: string;
    username: string;
    reports: Report[];
    postType: string;
}

export default function ModerationPanel() {
    const { data: session } = useSession();
    const [reportedPosts, setReportedPosts] = useState<ReportedPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReportedPosts();
    }, []);

    const fetchReportedPosts = async () => {
        try {
            const response = await fetch("/api/getreportedposts");
            const data = await response.json();
            
            if (response.ok) {
                setReportedPosts(data.posts);
            } else {
                toast.error("Failed to fetch reported posts");
            }
        } catch (error) {
            toast.error("Error loading reported posts");
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePost = async (postId: string) => {
        try {
            const response = await fetch("/api/deletepost", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ postId }),
            });

            if (response.ok) {
                toast.success("Post deleted successfully");
                setReportedPosts(prev => prev.filter(post => post.id !== postId));
            } else {
                toast.error("Failed to delete post");
            }
        } catch (error) {
            toast.error("Error deleting post");
        }
    };

    const handleIgnoreReports = async (postId: string) => {
        try {
            const response = await fetch("/api/clearreports", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ postId }),
            });

            if (response.ok) {
                toast.success("Reports cleared successfully");
                setReportedPosts(prev => prev.filter(post => post.id !== postId));
            } else {
                toast.error("Failed to clear reports");
            }
        } catch (error) {
            toast.error("Error clearing reports");
        }
    };

    if (loading) return <LoadingLogo />;

    if (!session?.user?.email) {
        return <div>Access denied. Please log in.</div>;
    }

    return (
        <div className="space-y-6 p-6 bg-white rounded-lg shadow">
            <h1 className="text-2xl font-bold mb-6">Content Moderation</h1>
            {reportedPosts.length === 0 ? (
                <p>No reported posts to review.</p>
            ) : (
                reportedPosts.map(post => (
                    <div key={post.id} className="border p-4 rounded-lg space-y-4">
                        <div>
                            <h2 className="text-xl font-semibold">{post.title}</h2>
                            <p className="text-gray-600">Posted by: {post.username}</p>
                            <p className="mt-2">{post.description}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                            <h3 className="font-semibold">Reports ({post.reports.length})</h3>
                            {post.reports.map((report, index) => (
                                <div key={index} className="mt-2 text-sm">
                                    <p>Reported by: {report.reportedBy}</p>
                                    <p>Reason: {report.reason}</p>
                                    <p className="text-gray-500">
                                        {new Date(report.timestamp).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="flex space-x-4">
                            <button
                                onClick={() => handleDeletePost(post.id)}
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                            >
                                Delete Post
                            </button>
                            <button
                                onClick={() => handleIgnoreReports(post.id)}
                                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                            >
                                Ignore Reports
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}