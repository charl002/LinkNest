import { NextResponse } from "next/server";
import { getFirestore, doc, getDoc, deleteDoc } from "firebase/firestore";
import firebase_app from "@/firebase/config";
import { authenticateRequest, authorizeUser } from "@/lib/authMiddleware";

const db = getFirestore(firebase_app);

export async function POST(request: Request) {
    try {
        // Check authentication
        const authError = await authenticateRequest();
        if (authError) return authError;

        const { messageId, username } = await request.json();

        // Authorize the user
        const authzError = await authorizeUser(username);
        if (authzError) return authzError;

        if (!messageId || !username || typeof messageId !== "string") {
            return NextResponse.json(
                { message: "Missing required fields: messageId or username" },
                { status: 400 }
            );
        }

        const messageRef = doc(db, "messages", messageId);
        const messageSnap = await getDoc(messageRef);

        if (!messageSnap.exists()) {
            return NextResponse.json(
                { message: "Message not found" },
                { status: 404 }
            );
        }

        const messageData = messageSnap.data();

        if (messageData.sender !== username) {
            return NextResponse.json(
                { message: "Unauthorized: You can only delete your own messages" },
                { status: 403 }
            );
        }

        await deleteDoc(messageRef);

        return NextResponse.json(
            { message: "Message deleted successfully" },
            { status: 200 }
        );

    } catch (error) {
        console.error("Server error:", error);
        return NextResponse.json(
            { message: "Internal server error", error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
