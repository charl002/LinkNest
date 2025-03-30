import { NextResponse } from "next/server";
import { withRetry } from '@/utils/backoff';
import { getData } from "@/firebase/firestore/getData";

/**
 * @swagger
 * /api/getusergroupchats:
 *   get:
 *     summary: Get group chats for a user
 *     description: Retrieves all group chats where the specified user is a member.
 *     parameters:
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *         required: true
 *         description: Username of the user
 *     responses:
 *       200:
 *         description: Group chats fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 groupChats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     additionalProperties: true
 *       400:
 *         description: Missing user query parameter
 *       500:
 *         description: Server error or unexpected failure
 */
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
