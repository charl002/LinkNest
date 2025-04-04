/**
 * @route GET /api/getfriends
 * @description Retrieves a list of friends for a given username.
 *
 * @query {string} username - The username of the user whose friends are being requested.
 *
 * @returns {200 OK} { friends: string[] } - List of usernames that are friends with the provided user.
 * @returns {400 Bad Request} If the `username` query parameter is missing.
 * @returns {404 Not Found} If no friend documents are found.
 * @returns {500 Internal Server Error} If a server error occurs or Firestore query fails.
 */
import { NextResponse } from "next/server";
import { getAllDocuments } from "@/firebase/firestore/getData";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const username = searchParams.get("username");

        if (!username) {
            return NextResponse.json({ message: "Username parameter is required" }, { status: 400 });
        }

        const { results, error } = await getAllDocuments("friends");

        if (error || !results) {
            return NextResponse.json({ message: "Error fetching friends", error }, { status: 500 });
        }

        if (results.empty) {
            return NextResponse.json({ message: "No friends found" }, { status: 404 });
        }

        const friends = results.docs
            .map(doc => doc.data())
            .filter(friend => friend.user1 === username || friend.user2 === username)
            .map(friend => (friend.user1 === username ? friend.user2 : friend.user1));

        return NextResponse.json({ friends }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Unexpected error", error }, { status: 500 });
    }
}
