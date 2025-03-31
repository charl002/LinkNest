import { NextResponse } from "next/server";
import addData from "@/firebase/firestore/addData"; 
import { withRetry } from "@/utils/backoff";

export async function POST(req: Request) {
  try {
    const { groupName, members, image } = await req.json();

    if (!groupName || !members || members.length < 2) {
      return NextResponse.json(
        { message: "Group name and at least two members are required" },
        { status: 400 }
      );
    }

    const data = {
      name: groupName,
      members: members,
      image,
      createdAt: new Date().toISOString(), // Add the creation timestamp
    };

    const { result: docId, error } = await withRetry(
      () => addData("group_chats", data), // Assuming "group_chats" is the Firestore collection
      {
        maxAttempts: 3,
        initialDelay: 500,
        maxDelay: 3000,
      }
    );

    if (error) {
      return NextResponse.json(
        { message: "Error adding group chat", error },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Group chat created", docId },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { message: "Unexpected error occurred", error: err },
      { status: 500 }
    );
  }
}
