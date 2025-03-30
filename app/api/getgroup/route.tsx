import { NextResponse } from "next/server";
import { getDocument } from "@/firebase/firestore/getData"; // We will define this function next

/**
 * @swagger
 * /api/getgroupchat:
 *   get:
 *     summary: Get group chat data by groupId
 *     description: Retrieves information about a group chat by its ID.
 *     parameters:
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the group chat
 *     responses:
 *       200:
 *         description: Group chat data returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 group:
 *                   type: object
 *                   additionalProperties: true
 *       400:
 *         description: groupId query parameter is missing
 *       404:
 *         description: Group not found
 *       500:
 *         description: Unexpected server error
 */
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
