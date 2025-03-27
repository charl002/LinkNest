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
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkAdminAndFetchPosts = async () => {
            if (!session?.user?.email) {
                setLoading(false);
                return;
            }

            try {
                // Check admin status first
                const adminResponse = await fetch(`/api/checkadmin?email=${encodeURIComponent(session.user.email)}`);
                const adminData = await adminResponse.json();

                if (!adminResponse.ok || !adminData.isAdmin) {
                    setIsAdmin(false);
                    setLoading(false);
                    return;
                }

                setIsAdmin(true);
                await fetchReportedPosts();
            } catch (error) {
                console.error("Error checking admin status:", error);
                setIsAdmin(false);
                toast.error("Error checking permissions");
            } finally {
                setLoading(false);
            }
        };

        checkAdminAndFetchPosts();
    }, [session]);

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
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center p-6 bg-white rounded-lg shadow">
                    <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
                    <p className="mt-2">Please log in to access this page.</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center p-6 bg-white rounded-lg shadow">
                    <h2 className="text-xl font-semibold text-red-600">Administrator Access Required</h2>
                    <p className="mt-2">You do not have permission to view this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6 bg-white rounded-lg shadow">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Content Moderation</h1>
                <span className="text-sm text-gray-500">
                    {reportedPosts.length} reported {reportedPosts.length === 1 ? 'post' : 'posts'}
                </span>
            </div>
            
            {reportedPosts.length === 0 ? (
                <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">No reported posts to review.</p>
                </div>
            ) : (
                reportedPosts.map(post => (
                    <div key={post.id} className="border p-4 rounded-lg space-y-4 hover:shadow-md transition-shadow">
                        <div>
                            <h2 className="text-xl font-semibold">{post.title}</h2>
                            <p className="text-gray-600">Posted by: {post.username}</p>
                            <p className="mt-2">{post.description}</p>
                            <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                {post.postType}
                            </span>
                        </div>
                        <div className="bg-gray-50 p-3 rounded">
                            <h3 className="font-semibold">Reports ({post.reports.length})</h3>
                            {post.reports.map((report, index) => (
                                <div key={index} className="mt-2 text-sm border-b last:border-0 pb-2">
                                    <p className="font-medium">Reported by: {report.reportedBy}</p>
                                    <p className="text-gray-700 mt-1">Reason: {report.reason}</p>
                                    <p className="text-gray-500 text-xs mt-1">
                                        {new Date(report.timestamp).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="flex space-x-4 pt-2">
                            <button
                                onClick={() => handleDeletePost(post.id)}
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors flex-1"
                            >
                                Delete Post
                            </button>
                            <button
                                onClick={() => handleIgnoreReports(post.id)}
                                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors flex-1"
                            >
                                Dismiss Reports
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}