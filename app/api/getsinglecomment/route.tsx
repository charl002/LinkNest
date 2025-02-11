import { NextResponse } from "next/server";
import { getDocument } from "@/firebase/firestore/getData";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ message: "Invalid parameters" }, { status: 400 });
    }

    const { result, error } = await getDocument("comments", id);

    if (error) {
        return NextResponse.json({ message: "Error fetching document", error }, { status: 500 });
    }

    if (result && result.exists()) {
        return NextResponse.json({ id: result.id, data: result.data() }, { status: 200 });
    } else {
        return NextResponse.json({ message: "Document not found" }, { status: 404 });
    }
}
