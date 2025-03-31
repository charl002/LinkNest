import { NextResponse } from "next/server";
import { getFirestore, doc, getDoc } from "@firebase/firestore";
import firebase_app from "@/firebase/config";

const db = getFirestore(firebase_app);

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const messageId = searchParams.get("messageId");

        if (!messageId) {
            return NextResponse.json({ message: "Message ID is required." }, { status: 400 });
        }

        const messageRef = doc(db, "messages", messageId);
        const messageSnap = await getDoc(messageRef);

        if (!messageSnap.exists()) {
            return NextResponse.json({ message: "Message not found." }, { status: 404 });
        }

        return NextResponse.json({ id: messageId, ...messageSnap.data() }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Unexpected error occurred", error }, { status: 500 });
    }
}
