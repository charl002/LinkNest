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
