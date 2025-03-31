import { NextResponse } from "next/server";
import addData from "@/firebase/firestore/addData"; 
import { withRetry } from "@/utils/backoff";

/**
 * @swagger
 * /api/postgroupchat:
 *   post:
 *     summary: Create a new group chat
 *     description: Creates a new group chat with a name, members, and optional image. At least two members are required.
 *     tags:
 *       - Group Chats
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - groupName
 *               - members
 *             properties:
 *               groupName:
 *                 type: string
 *                 example: "Project Team"
 *               members:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["alice", "bob", "carol"]
 *               image:
 *                 type: string
 *                 format: uri
 *                 example: "https://example.com/group-avatar.jpg"
 *     responses:
 *       200:
 *         description: Group chat created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Group chat created
 *                 docId:
 *                   type: string
 *                   example: "123ABCxyz"
 *       400:
 *         description: Invalid input (missing name or not enough members)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Server or database error
 */
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
