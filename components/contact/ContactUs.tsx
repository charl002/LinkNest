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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-16">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-lg">
        <div className="flex flex-col items-center text-center">
          <Mail className="h-10 w-10 text-blue-500 mb-2" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Contact Us</h1>
          <p className="text-gray-600 text-sm mb-6">
            Have suggestions or found a bug? We’d love to hear from you!
          </p>
          <input
            type="text"
            placeholder="Subject (optional)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full mb-3 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <textarea
            rows={4}
            placeholder="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full mb-4 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            onClick={handleSend}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-md transition duration-200 shadow-md"
          >
            Send Message
          </button>
          <p className="text-xs text-gray-400 mt-4">linknestlive@gmail.com</p>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;