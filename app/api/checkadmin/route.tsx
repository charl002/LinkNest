import { NextResponse } from "next/server";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import firebase_app from "@/firebase/config";

const db = getFirestore(firebase_app);

/**
 * @swagger
 * /api/checkadmin:
 *   get:
 *     summary: Check if a user is an admin
 *     description: Returns whether a user has administrative privileges based on their email.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: The email address of the user to check
 *     responses:
 *       200:
 *         description: Successfully retrieved admin status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isAdmin:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Missing email parameter
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
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