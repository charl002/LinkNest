"use client";

import React, { useState } from "react";
import { Mail } from "lucide-react";

const ContactUs = () => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSend = () => {
    const mailtoLink = `mailto:linknestlive@gmail.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(message)}`;
    window.location.href = mailtoLink;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-blue-50 px-4 py-16">
      <div className="bg-white shadow-2xl rounded-2xl p-10 w-full max-w-lg transition-all duration-300 hover:scale-[1.01]">
        <div className="flex flex-col items-center text-center mb-6">
          <Mail className="h-12 w-12 text-blue-500 mb-3 animate-bounce-slow" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Contact Us</h1>
          <p className="text-gray-600 text-sm mb-2">
            Have suggestions or found a bug? We’d love to hear from you!
          </p>
          <div className="space-y-4">
            <input
                type="text"
                placeholder="Subject (optional)"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            />
            <textarea
                rows={4}
                placeholder="Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
            />
            <button
                onClick={handleSend}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-md shadow-lg transition duration-200"
            >
                Send Message
            </button>
          </div>
          <p className="text-sm text-center text-gray-400 mt-6">linknestlive@gmail.com</p>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;