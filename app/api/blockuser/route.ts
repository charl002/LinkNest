/**
 * @route POST /api/blockuser
 * @description Authenticated route to block or unblock a user.
 * The current user (blocker) can block or unblock another user by username.
 * Requires authentication and authorization.
 * 
 * @param {string} userId - The username of the user performing the block/unblock.
 * @param {string} blockedUserId - The username of the user to be blocked or unblocked.
 * 
 * @returns {200 OK} - JSON response with a success message.
 * @returns {400 Bad Request} - Missing required usernames.
 * @returns {404 Not Found} - Blocker user not found in Firestore.
 * @returns {500 Internal Server Error} - Server or Firestore error.
 */
import { NextResponse } from "next/server";
import { getFirestore, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import firebase_app from "@/firebase/config";
import { authenticateRequest, authorizeUser } from "@/lib/authMiddleware";

const db = getFirestore(firebase_app);

export async function POST(request: Request) {
  // Check authentication
  const authError = await authenticateRequest();
  if (authError) return authError;

  try {
    const { userId: blockerUsername, blockedUserId: blockedUsername } = await request.json();

    if (!blockerUsername || !blockedUsername) {
      return NextResponse.json(
        { message: "Usernames are required" },
        { status: 400 }
      );
    }

    // Authorize the user making the request
    const authzError = await authorizeUser(blockerUsername);
    if (authzError) return authzError;

    // Get the blocker's user document
    const usersRef = collection(db, "users");
    const blockerQuery = query(usersRef, where("username", "==", blockerUsername));
    const blockerSnapshot = await getDocs(blockerQuery);

    if (blockerSnapshot.empty) {
      return NextResponse.json(
        { message: "Blocker user not found" },
        { status: 404 }
      );
    }

    const blockerDoc = blockerSnapshot.docs[0];
    const blockedUsers = blockerDoc.data().blockedUsers || [];
    const isAlreadyBlocked = blockedUsers.includes(blockedUsername);

    await updateDoc(blockerDoc.ref, {
      blockedUsers: isAlreadyBlocked
        ? blockedUsers.filter((username: string) => username !== blockedUsername)
        : [...blockedUsers, blockedUsername]
    });

    return NextResponse.json(
      { 
        message: isAlreadyBlocked ? "User unblocked successfully" : "User blocked successfully"
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error updating user block status:", error);
    return NextResponse.json(
      { message: "Failed to update user block status" },
      { status: 500 }
    );
  }
}