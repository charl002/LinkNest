import { NextResponse } from "next/server";
import addData from "@/firebase/firestore/addData";
import { getAllDocuments } from "@/firebase/firestore/getData";
import { GET as getBluesky } from "../getbluesky/route";

interface Results {
  added: (string | null)[];
  skipped: string[];
}

export async function POST() {
  try {
    const response = await getBluesky();
    if (!(response instanceof NextResponse)) {
      throw new Error('Invalid response from Bluesky API');
    }

    const data = await response.json();
    
    if (!data || !data.posts || !Array.isArray(data.posts)) {
      throw new Error('Invalid Bluesky data format');
    }

    const { results: existingBlueSkyDocs, error: fetchError } = await getAllDocuments('bluesky');
    
    if (fetchError) {
      throw new Error('Failed to fetch existing Bluesky posts');
    }

    const existingIds = new Set(
      existingBlueSkyDocs?.docs.map(doc => doc.data().id) || []
    );

    const results: Results = {
      added: [],
      skipped: []
    };

    for (const post of data.posts) {
      if (existingIds.has(post.id)) {
        results.skipped.push(post.id);
        continue;
      }

      const postWithLikes = {
        ...post,
        comments: [],
        likes: 0,
        likedBy: []
      };

      const { result, error } = await addData('bluesky', postWithLikes);
      
      if (error) {
        console.error('Error adding Bluesky post:', error);
        continue;
      }
      
      results.added.push(result);
    }

    if (results.added.length === 0) {
      return NextResponse.json(
        { 
          message: 'No new posts added', 
          skipped: results.skipped.length,
          results 
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { 
        message: `Successfully added ${results.added.length} Bluesky posts`, 
        skipped: results.skipped.length,
        results 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error in POST /api/bluesky/postbluesky:', error);
    return NextResponse.json(
      { message: 'An error occurred', error },
      { status: 500 }
    );
  }
}

// Example usage:
// fetch('/api/bluesky/postbluesky', {
//   method: 'POST'
// }).then(res => res.json()).then(console.log)
