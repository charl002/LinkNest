import { NextResponse } from "next/server";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import firebase_app from "@/firebase/config";

const db = getFirestore(firebase_app);

export async function POST(request: Request) {
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