"use client";

import { useState, useEffect } from "react";
import { RefreshCw, Loader2 } from "lucide-react";

export default function HealthCheck() {

    const [status, setStatus] = useState("Checking...");
    const [timestamp, setTimestamp] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchHealthStatus = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/gethealth?" + new Date().getTime()); // Prevent caching
        if (!response.ok) throw new Error("Failed to fetch health status");
        const data = await response.json();
        console.log(data);
        setStatus("Online");
        setTimestamp(new Date().toLocaleString()); // Always update with the latest timestamp
        } catch (err) {
            console.log(err);
            setStatus("Offline");
            setTimestamp(new Date().toLocaleString()); // Show the last attempted check time
            setError("Unable to fetch server status. Please try again.");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchHealthStatus();
        const interval = setInterval(fetchHealthStatus, 30000); // Auto-refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

  return (
    <div className="p-6 max-w-md mx-auto shadow-xl rounded-lg border bg-white text-center space-y-4">
      <h2 className="text-2xl font-semibold">Website Status</h2>
      <div className="flex items-center justify-center space-x-2">
        <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${status === "Online" ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}>
          {status}
        </span>
        {loading && <Loader2 className="animate-spin w-5 h-5 text-gray-600" />}
      </div>
      {timestamp && <p className="text-sm text-gray-500">Last Checked: {timestamp}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex justify-center">
        <button
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition disabled:opacity-50"
          onClick={fetchHealthStatus}
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
          {loading ? "Checking..." : "Refresh"}
        </button>
      </div>
    </div>
  );
}
