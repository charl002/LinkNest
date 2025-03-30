import { NextResponse } from "next/server";
import addData from "@/firebase/firestore/addData";

/**
 * @swagger
 * /api/postuser:
 *   post:
 *     summary: Register a new user
 *     description: Stores a new user in the Firestore `users` collection with email, name, username, and optional description.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - name
 *               - image
 *               - username
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: johndoe@example.com
 *               name:
 *                 type: string
 *                 example: John Doe
 *               image:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/profile.jpg
 *               username:
 *                 type: string
 *                 example: johndoe
 *               description:
 *                 type: string
 *                 example: Just another dev trying to make it big.
 *     responses:
 *       200:
 *         description: User added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: user added successfully
 *                 id:
 *                   type: string
 *                   example: abc123
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
export async function POST(req: Request) {
    try {
        const { email, name, image, username, description } = await req.json();

        if (!email || !name || !image || !username) {
            return NextResponse.json({ message: "Email, name, username, and image are required" }, { status: 400 });
        }

        const data = { email, name, image, username, description };
        const { result: docId, error } = await addData("users", data);

        if (error) {
            return NextResponse.json({ message: "Error adding user", error }, { status: 500 });
        }

        return NextResponse.json({ message: "user added successfully", id: docId }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ message: "Unexpected error occurred", error: err }, { status: 500 });
    }
}

