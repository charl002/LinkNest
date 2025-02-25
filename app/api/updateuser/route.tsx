import { NextResponse } from "next/server";
import firebase_app from "@/firebase/config";
import { getFirestore, doc, updateDoc } from "@firebase/firestore";

const db = getFirestore(firebase_app);

export async function PATCH(req: Request) {
    try {
        const { id, username, description } = await req.json();

        // Validate required fields
        if (!id || !username) {
            return NextResponse.json({ message: "User ID and username are required" }, { status: 400 });
        }

        // Reference the user document
        const userRef = doc(db, "users", id);

        // Update fields
        await updateDoc(userRef, {
            username,
            description: description ?? "", // Set to empty string if not provided
        });

        return NextResponse.json({ message: "User updated successfully" }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ message: "Unexpected error occurred", error: err }, { status: 500 });
    }
}
