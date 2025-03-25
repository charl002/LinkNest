import { NextResponse } from "next/server";
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import firebase_app from "@/firebase/config";

const db = getFirestore(firebase_app);

export async function DELETE(req: Request) {
    try {
        const { username } = await req.json();

        if (!username) {
            return NextResponse.json({ message: "Username is required" }, { status: 400 });
        }

        const usersRef = collection(db, "users");
        const userQuery = query(usersRef, where("username", "==", username));
        const userSnapshot = await getDocs(userQuery);

        if (userSnapshot.empty) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        const postsRef = collection(db, "posts");
        const postsQuery = query(postsRef, where("username", "==", username));
        const postsSnapshot = await getDocs(postsQuery);

        // Delete all posts associated with the username
        const deletePostPromises = postsSnapshot.docs.map(async (postDoc) => {
            await deleteDoc(doc(db, "posts", postDoc.id));
        });

        await Promise.all(deletePostPromises);

        // Delete user account
        const deleteUserPromises = userSnapshot.docs.map(async (userDoc) => {
            await deleteDoc(doc(db, "users", userDoc.id));
        });

        await Promise.all(deleteUserPromises);

        return NextResponse.json({ message: "User and associated posts deleted successfully" }, { status: 200 });

    } catch (err) {
        return NextResponse.json({ message: "Unexpected error occurred", error: err }, { status: 500 });
    }
}
