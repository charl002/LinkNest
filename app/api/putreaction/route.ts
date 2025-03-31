import { NextResponse } from "next/server";
import updateArrayField from "@/firebase/firestore/updateReaction";

/**
 * @swagger
 * /api/putreaction:
 *   put:
 *     summary: Add or update a reaction to a message
 *     description: Appends a user's emoji reaction to a message document.
 *     tags:
 *       - Messages
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messageId
 *               - user
 *               - emoji
 *             properties:
 *               messageId:
 *                 type: string
 *                 description: ID of the message to react to
 *                 example: "abc123"
 *               user:
 *                 type: string
 *                 description: Username of the user reacting
 *                 example: "janedoe"
 *               emoji:
 *                 type: string
 *                 description: The emoji representing the user's reaction
 *                 example: "😂"
 *     responses:
 *       200:
 *         description: Reaction added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "comment added successfully"
 *                 id:
 *                   type: string
 *                   example: "abc123"
 *       401:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */
export async function PUT(req: Request) {
    try {
        const { messageId, user, emoji } = await req.json();

        if (!messageId || !user || !emoji ) {
            return NextResponse.json({ message: "MessageId, user and emoji is required." }, { status: 401 });
        }

        const updateData = { user: user, reaction: emoji};

        const { result: docId, error } = await updateArrayField("messages", messageId, "reactions", updateData);

        if (error) {
            return NextResponse.json({ message: "Error adding comment", error }, { status: 500 });
        }

        return NextResponse.json({ message: "comment added successfully", id: docId }, { status: 200 });

    } catch (err) {
        return NextResponse.json({ message: "Unexpected error occurred", error: err }, { status: 500 });
    }
}

