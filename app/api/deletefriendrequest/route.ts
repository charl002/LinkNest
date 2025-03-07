import { NextResponse } from "next/server";
import { getAllDocuments } from "@/firebase/firestore/getData";
import  deleteData  from "@/firebase/firestore/deleteData"
 
export async function DELETE(req: Request) {
    try {
        const { senderUsername, receiverUsername } = await req.json();

        if (!senderUsername || !receiverUsername) {
            return NextResponse.json({ message: "Both usernames are required" }, { status: 400 });
        }

        const { results, error } = await getAllDocuments("friend_requests");

        if (error || !results) {
            return NextResponse.json({ message: "Error fetching friend requests", error }, { status: 500 });
        }

        const requestDoc = results.docs.find(doc => {
            const data = doc.data();
            return data.senderUsername === senderUsername && data.receiverUsername === receiverUsername;
        });

        if (!requestDoc) {
            return NextResponse.json({ message: "Friend request not found" }, { status: 404 });
        }

        const { error: deleteError } = await deleteData("friend_requests", requestDoc.id);

        if (deleteError) {
            return NextResponse.json({ message: "Error deleting friend request", error: deleteError }, { status: 500 });
        }

        return NextResponse.json({ message: "Friend request deleted successfully" }, { status: 200 });

    } catch (err) {
        return NextResponse.json({ message: "Unexpected error occurred", error: err }, { status: 500 });
    }
}
