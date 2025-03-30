import { NextResponse } from "next/server";
import { getAllDocuments } from "@/firebase/firestore/getData";

/**
 * @swagger
 * /api/getfriends:
 *   get:
 *     summary: Get a user's friends
 *     description: Returns a list of usernames who are friends with the specified user.
 *     tags:
 *      - Friends
 *     parameters:
 *       - in: query
 *         name: username
 *         schema:
 *           type: string
 *         required: true
 *         description: The username of the user to find friends for
 *     responses:
 *       200:
 *         description: A list of friend usernames
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 friends:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Username query parameter is missing
 *       404:
 *         description: No friends found
 *       500:
 *         description: Server error
 */
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
