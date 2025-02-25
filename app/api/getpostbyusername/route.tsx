import { NextResponse } from "next/server";
import { getFirestore, collection, query, where, getDocs } from "@firebase/firestore";
import firebase_app from "@/firebase/config";

const db = getFirestore(firebase_app);

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
        return NextResponse.json({ message: "Username parameter is required" }, { status: 400 });
    }

    try {
        const postsRef = collection(db, "posts");
        const q = query(postsRef, where("username", "==", username));
        const querySnapshot = await getDocs(q);

        const posts = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                title: data.title,
                username: data.username,
                description: data.text,
                tags: data.tags || [],
                comments: data.comments || [],
                likes: data.likes || 0,
                images: [{ url: data.fileUrl, alt: data.title, thumb: data.fileUrl }]
            };
        });

        return NextResponse.json({ success: true, posts }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error fetching posts", error }, { status: 500 });
    }
}
