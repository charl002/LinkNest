/**
 * @route PATCH /api/updateuser
 * @description Updates a user's profile information in Firestore.
 *
 * @requestBody JSON {
 *   id: string;           // Firestore document ID of the user (required)
 *   username: string;     // Username of the authenticated user (required)
 *   image?: string;       // New profile image URL (optional)
 *   description?: string; // User description or bio (optional)
 *   background?: string;  // Background image URL (optional)
 * }
 *
 * @returns {200 OK} User profile updated successfully.
 * @returns {400 Bad Request} If required fields (id, username) are missing.
 * @returns {401/403 Unauthorized} If authentication or authorization fails.
 * @returns {500 Internal Server Error} On unexpected failure.
 */
import { NextResponse } from "next/server";
import firebase_app from "@/firebase/config";
import { getFirestore, doc, updateDoc } from "@firebase/firestore";
import { authenticateRequest, authorizeUser } from "@/lib/authMiddleware";

const db = getFirestore(firebase_app);

export async function PATCH(req: Request) {
    try {
        // Check authentication
        const authError = await authenticateRequest();
        if (authError) return authError;

        const { id, username, description, image, background } = await req.json();

        // Validate required fields
        if (!id || !username) {
            return NextResponse.json({ message: "User ID and username are required" }, { status: 400 });
        }

        // Authorize the user
        const authzError = await authorizeUser(username);
        if (authzError) return authzError;

        // Reference the user document
        const userRef = doc(db, "users", id);

        // Update fields
        await updateDoc(userRef, {
            image: image,
            username,
            description: description ?? "", // Set to empty string if not provided
            background: background,
        });

        return NextResponse.json({ message: "User updated successfully" }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ message: "Unexpected error occurred", error: err }, { status: 500 });
    }
}
