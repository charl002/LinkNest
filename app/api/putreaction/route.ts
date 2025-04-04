/**
 * @route PUT /api/putreaction
 * @description Adds or updates a user's emoji reaction on a specific message.
 *
 * @requestBody JSON {
 *   messageId: string;  // ID of the message being reacted to (required)
 *   user: string;       // Username of the user reacting (required)
 *   emoji: string;      // Emoji reaction to add (required)
 * }
 *
 * @returns {200 OK} Reaction successfully added or updated.
 * @returns {400/401} If any required fields are missing or unauthorized access.
 * @returns {403 Forbidden} If the user is not authorized.
 * @returns {500 Internal Server Error} If the update fails.
 */
import { NextResponse } from "next/server";
import updateArrayField from "@/firebase/firestore/updateReaction";
import { authenticateRequest, authorizeUser } from "@/lib/authMiddleware";

export async function PUT(req: Request) {
    try {
        // Check authentication
        const authError = await authenticateRequest();
        if (authError) return authError;

        const { messageId, user, emoji } = await req.json();

        // Authorize the user
        const authzError = await authorizeUser(user);
        if (authzError) return authzError;

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

