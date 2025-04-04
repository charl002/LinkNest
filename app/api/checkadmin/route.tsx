/**
 * @route GET /api/checkadmin
 * @description Checks if a user with the provided email is an admin.
 *
 * @queryParam {string} email - The email address of the user to check.
 *
 * @returns {200 OK} `{ isAdmin: true | false }` - Whether the user has admin privileges.
 * @returns {400 Bad Request} `{ isAdmin: false }` - If no email is provided.
 * @returns {404 Not Found} `{ isAdmin: false }` - If user with provided email is not found.
 * @returns {500 Internal Server Error} `{ isAdmin: false }` - On any unexpected server error.
 */
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