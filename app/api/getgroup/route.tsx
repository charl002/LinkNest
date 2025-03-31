import { NextResponse } from "next/server";
import { getDocument } from "@/firebase/firestore/getData"; // We will define this function next

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");

    if (!groupId) {
      return NextResponse.json(
        { message: "groupId parameter is required" },
        { status: 400 }
      );
    }

    const { result, error } = await getDocument("group_chats", groupId);

    if (error || !result) {
      return NextResponse.json({ message: "Group not found", error }, { status: 404 });
    }
    return NextResponse.json({ group: result.data() }, { status: 200 }); // Return group data
  } catch (error) {
    return NextResponse.json({ message: "Unexpected error", error }, { status: 500 });
  }
}
