import { NextResponse } from "next/server";
import { getAllDocuments } from "@/firebase/firestore/getData";

export async function GET(){
    try{
        const { results, error } = await getAllDocuments("posts");

        if (error || !results) {
            return NextResponse.json({ message: "Error fetching posts", error }, { status: 500 });
        }

        if (results.empty) {
            return NextResponse.json({ message: "No posts found" }, { status: 404 });
        }

        const posts = results.docs.map(post => ({
            id: post.id,
            ...post.data(),
        }));

        return NextResponse.json({ posts }, { status: 200 });
    } catch (err) {
        return NextResponse.json({ message: "Unexpected error occurred", error: err }, { status: 500 });
    }
}
