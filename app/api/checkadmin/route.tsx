import { NextResponse } from "next/server";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import firebase_app from "@/firebase/config";

const db = getFirestore(firebase_app);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
        return NextResponse.json({ isAdmin: false }, { status: 400 });
    }

    try {
        // Query users collection where email matches
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return NextResponse.json({ isAdmin: false }, { status: 404 });
        }

        // Get the first matching user document
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        return NextResponse.json({ isAdmin: userData.isAdmin || false }, { status: 200 });
    } catch (error) {
        console.error("Error checking admin status:", error);
        return NextResponse.json({ isAdmin: false }, { status: 500 });
    }
}