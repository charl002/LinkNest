/**
 * @route POST /api/postuser
 * @description Registers a new user by storing their data in the Firestore "users" collection.
 *
 * @requestBody JSON {
 *   email: string;         // User's email (required)
 *   name: string;          // Full name (required)
 *   image: string;         // Profile picture URL (required)
 *   username: string;      // Unique username (required)
 *   description?: string;  // Optional user bio/description
 * }
 *
 * @returns {200 OK} If the user was added successfully.
 * @returns {400 Bad Request} If required fields are missing.
 * @returns {500 Internal Server Error} If Firestore insertion fails.
 */
import { NextResponse } from "next/server";
import addData from "@/firebase/firestore/addData";

export async function POST(req: Request) {
    try {
        const { email, name, image, username, description } = await req.json();

        if (!email || !name || !image || !username) {
            return NextResponse.json({ message: "Email, name, username, and image are required" }, { status: 400 });
        }

        const data = { email, name, image, username, description };
        const { result: docId, error } = await addData("users", data);

        if (error) {
            return NextResponse.json({ message: "Error adding user", error }, { status: 500 });
        }

        return NextResponse.json({ message: "user added successfully", id: docId }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ message: "Unexpected error occurred", error: err }, { status: 500 });
    }
}

