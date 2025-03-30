import { NextResponse } from "next/server";
import firebase_app from "@/firebase/config";
import { getFirestore, doc, updateDoc } from "@firebase/firestore";

const db = getFirestore(firebase_app);

/**
 * @swagger
 * /api/updateuser:
 *   patch:
 *     summary: Update user profile
 *     description: Update a user's username, profile picture, background, or description.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - username
 *             properties:
 *               id:
 *                 type: string
 *                 description: Firestore document ID of the user
 *                 example: "abc123"
 *               username:
 *                 type: string
 *                 description: New username
 *                 example: "new_username"
 *               description:
 *                 type: string
 *                 description: User's profile description
 *                 example: "Updated profile description"
 *               image:
 *                 type: string
 *                 description: Profile picture URL
 *                 example: "https://example.com/profile.jpg"
 *               background:
 *                 type: string
 *                 description: Background image URL
 *                 example: "https://example.com/background.jpg"
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Unexpected server error
 */
export async function PATCH(req: Request) {
    try {
        const { id, username, description, image, background } = await req.json();

        // Validate required fields
        if (!id || !username) {
            return NextResponse.json({ message: "User ID and username are required" }, { status: 400 });
        }

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
