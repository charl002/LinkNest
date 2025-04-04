/**
 * @route GET /api/getusergroups
 * @description Retrieves all group chats from the 'group_chats' collection that the specified user is a member of.
 *
 * @query {string} user - The username of the current user.
 *
 * @returns {200 OK} { groupChats: object[] } - An array of group chats the user is a part of.
 * @returns {400 Bad Request} If the `user` query parameter is missing.
 * @returns {500 Internal Server Error} If an error occurs while querying Firestore or processing the request.
 */
import { NextResponse } from "next/server";
import { withRetry } from '@/utils/backoff';
import { getData } from "@/firebase/firestore/getData";

export async function GET(req: Request) {
  try {
    // Get the current user's username from the query parameters
    const url = new URL(req.url);
    const currentUsername = url.searchParams.get("user");

    if (!currentUsername) {
      return NextResponse.json(
        { message: "User is required" },
        { status: 400 }
      );
    }

    // Fetch group chats from Firestore
    const { data: groupChats, error } = await withRetry(
      () => getData("group_chats", { field: "members", value: currentUsername }),  // Query group_chats where the currentUsername is a member
      {
        maxAttempts: 3,
        initialDelay: 500,
        maxDelay: 3000
      }
    );

    if (error) {
      return NextResponse.json(
        { message: "Error fetching group chats", error },
        { status: 500 }
      );
    }

    return NextResponse.json({ groupChats }, { status: 200 });

  } catch (err) {
    return NextResponse.json(
      { message: "Unexpected error occurred", error: err },
      { status: 500 }
    );
  }
}
