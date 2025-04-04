/**
 * @route POST /api/banuser
 * @description Admin-only route to update a user's ban status in Firestore.
 * 
 * The request must include:
 * - `userId` (string): The ID of the user to update.
 * - `isBanned` (boolean): Whether the user should be banned or unbanned.
 * 
 * Requires admin authentication via `authenticateAdmin()`. If the user is not
 * authorized as an admin, the route will return an appropriate error.
 * 
 * @returns 200 OK if the update is successful, 400 if required fields are missing,
 * or 500 if an internal server error occurs.
 */
import { NextResponse } from "next/server";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import firebase_app from "@/firebase/config";
import { authenticateAdmin } from "@/lib/authMiddleware";

const db = getFirestore(firebase_app);

export async function POST(request: Request) {
  // Check admin authentication
  const authError = await authenticateAdmin();
  if (authError) return authError;

  try {
    const { userId, isBanned } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      isBanned: isBanned
    });

    return NextResponse.json(
      { message: "User ban status updated successfully" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error updating user ban status:", error);
    return NextResponse.json(
      { message: "Failed to update user ban status" },
      { status: 500 }
    );
  }
}