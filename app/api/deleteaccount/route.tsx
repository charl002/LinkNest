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
        const q = query(usersRef, where("username", "==", username));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        const batch = querySnapshot.docs.map(async (docSnap) => await deleteDoc(doc(db, "users", docSnap.id)));

        await Promise.all(batch);

        return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });

    } catch (err) {
        return NextResponse.json({ message: "Unexpected error occurred", error: err }, { status: 500 });
    }
}
