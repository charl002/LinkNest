/**
 * @route GET /api/gethealth
 * @description Health check endpoint to confirm the server is running.
 *
 * @returns {200 OK} { status: "OK", timestamp: string } - Returns a success status and current timestamp.
 * @returns {500 Internal Server Error} If an unexpected error occurs.
 *
 * @headers {Cache-Control} public, max-age=300 - Response can be cached for 5 minutes.
 */
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const responseData = {
            status: "OK",
            timestamp: new Date().toISOString(),
        };

        return NextResponse.json(responseData, {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Cache-Control": "public, max-age=300", // Cache for 5 minutes
            },
        });
    } catch (err) {
        return NextResponse.json(
            { message: "Unexpected error occurred", error: err },
            { status: 500 }
        );
    }
}
