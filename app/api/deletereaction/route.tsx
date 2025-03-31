import { NextResponse } from "next/server";
import { getFirestore, doc, getDoc, updateDoc } from "@firebase/firestore";
import firebase_app from "@/firebase/config";

const db = getFirestore(firebase_app);

export async function PUT(req: Request) {
    try {
        const { messageId, user } = await req.json();

        if (!messageId || !user) {
            return NextResponse.json({ message: "MessageId and user are required." }, { status: 400 });
        }

        const messageRef = doc(db, "messages", messageId);
        const messageSnap = await getDoc(messageRef);

        if (!messageSnap.exists()) {
            return NextResponse.json({ message: "Message not found." }, { status: 404 });
        }

        let reactions = messageSnap.data().reactions || [];

        reactions = reactions.filter((reaction: { user: string }) => reaction.user !== user);

        await updateDoc(messageRef, { reactions });

        return NextResponse.json({ message: "Reaction removed successfully", id: messageId }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Unexpected error occurred", error }, { status: 500 });
    }
}
