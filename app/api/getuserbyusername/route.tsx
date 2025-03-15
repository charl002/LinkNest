import { NextResponse } from "next/server";
import { getFirestore, collection, query, where, getDocs } from "@firebase/firestore";
import firebase_app from "@/firebase/config";
import { withRetry } from '@/utils/backoff';

const db = getFirestore(firebase_app);

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
        return NextResponse.json({ message: "Username parameter is required" }, { status: 400 });
    }

    try {
    
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", username));
        const querySnapshot = await withRetry(
            () => getDocs(q),
            {
                maxAttempts: 3,
                initialDelay: 500,
                maxDelay: 3000
            }
        );

        if (querySnapshot.empty) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        const userDoc = querySnapshot.docs[0];

        return NextResponse.json({ id: userDoc.id, data: userDoc.data() }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error fetching user", error }, { status: 500 });
    }
}
