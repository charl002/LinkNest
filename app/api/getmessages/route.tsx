import { NextResponse } from "next/server";
import { getAllDocuments } from "@/firebase/firestore/getData";
import { auth } from "@/lib/auth";

interface Message {
    id: string;
    sender: string;
    receiver: string;
    message: string;
    seen: boolean;
    date: Date; 
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const sender = searchParams.get("sender");
        const receiver = searchParams.get("receiver");
        const session = await auth();

        if (!session || !session.user) {
          return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        if (!sender || !receiver) {
            return NextResponse.json({ message: "Sender and receiver usernames are required" }, { status: 400 });
        }

        const { results, error } = await getAllDocuments("messages");

        if (error || !results) {
            return NextResponse.json({ message: "Error fetching messages", error }, { status: 500 });
        }

        if (results.empty) {
            return NextResponse.json({ messages: [], message: "No messages found" }, { status: 200 });
        }

        const messages: Message[] = results.docs
            .map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    sender: data.sender,
                    receiver: data.receiver,
                    message: data.message,
                    seen: data.seen,
                    date: new Date(data.date),
                };
            })
            .filter(msg =>
                (msg.sender === sender && msg.receiver === receiver) ||
                (msg.sender === receiver && msg.receiver === sender)
            )
            .sort((a, b) => a.date.getTime() - b.date.getTime());

        return NextResponse.json({ messages }, { status: 200 });

    } catch (error) {
        console.error("Error fetching messages:", error);
        return NextResponse.json({ message: "Unexpected error occurred", error }, { status: 500 });
    }
}
