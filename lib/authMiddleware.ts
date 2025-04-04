import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import firebase_app from "@/firebase/config";

const db = getFirestore(firebase_app);

export async function authenticateRequest() {
  const session = await auth();
  
  if (!session || !session.user) {
    return NextResponse.json(
      { message: "Unauthorized - Please sign in" },
      { status: 401 }
    );
  }

  return null;
}

export async function authenticateAdmin() {
  const authError = await authenticateRequest();
  if (authError) return authError;

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  // Check if user is admin
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("email", "==", session.user.email));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty || !querySnapshot.docs[0].data().isAdmin) {
    return NextResponse.json(
      { message: "Unauthorized - Admin access required" },
      { status: 403 }
    );
  }

  return null;
}

export async function authorizeUser(username: string) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  // Get user document by email
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("email", "==", session.user.email));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return NextResponse.json(
      { message: "User not found" },
      { status: 404 }
    );
  }

  const userData = querySnapshot.docs[0].data();
  
  // Check if the authenticated user matches the requested username
  if (userData.username !== username && !userData.isAdmin) {
    return NextResponse.json(
      { message: "Forbidden - You don't have permission to access this resource" },
      { status: 403 }
    );
  }

  return null;
}