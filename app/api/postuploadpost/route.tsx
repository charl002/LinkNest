import { NextResponse } from "next/server";
import addData from "@/firebase/firestore/addData";

export async function POST(req: Request) {
  try {
      const { username, title, text, date, tags, file } = await req.json();

      if (!username || !title || !text || !date) {
          return NextResponse.json({ message: "Username, Title, Text and Date are required." }, { status: 400 });
      }

      const data = { username, title, text, date, tags: tags || [], file: file || null, likes: 0, comments: []};
      const { result: docId, error } = await addData("posts", data);

      if (error) {
          return NextResponse.json({ message: "Error adding post", error }, { status: 500 });
      }

      return NextResponse.json({ message: "post added successfully", id: docId }, { status: 200 });
  } catch (err) {
      return NextResponse.json({ message: "Unexpected error occurred", error: err }, { status: 500 });
    } 
}