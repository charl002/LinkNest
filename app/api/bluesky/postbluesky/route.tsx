/**
 * @route POST /api/bluesky/postbluesky
 * @description Fetches Bluesky posts using the internal API, checks against 
 * existing records in Firestore, and adds only new posts to the 'bluesky' collection. Adds 
 * metadata fields (`likes`, `likedBy`, `comments`) during insert. Skips posts that already exist based on ID.
 *
 * @returns {201 Created} On successful insertion of one or more new posts.
 * @returns {200 OK} If no new posts were added (all were already present).
 * @returns {500 Internal Server Error} If an error occurs during fetch, validation, or database write.
 */
import { NextResponse } from "next/server";
import addData from "@/firebase/firestore/addData";
import { getAllDocuments } from "@/firebase/firestore/getData";
import { GET as getBluesky } from "../getbluesky/route";
import { withRetry } from '@/utils/backoff';

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
      console.error('Invalid Bluesky data format:', data);
      throw new Error('Invalid Bluesky data format');
    }

    console.log(`Fetched ${data.posts.length} posts from Bluesky API`);

    const { results: existingBlueSkyDocs, error: fetchError } = await withRetry(
        () => getAllDocuments('bluesky'),
        {
            maxAttempts: 3,
            initialDelay: 1000,
            maxDelay: 5000
        }
    );
    
    if (fetchError) {
      console.error('Error fetching existing posts:', fetchError);
      throw new Error('Failed to fetch existing Bluesky posts');
    }

    const existingIds = new Set(
      existingBlueSkyDocs?.docs.map(doc => doc.data().id) || []
    );

    console.log(`Found ${existingIds.size} existing posts in database`);

    const results: Results = {
      added: [],
      skipped: []
    };

    for (const post of data.posts) {
      if (!post.id) {
        console.error('Post missing ID:', post);
        continue;
      }

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

      const { result, error } = await withRetry(
          () => addData('bluesky', postWithLikes, post.id),
          {
              maxAttempts: 3,
              initialDelay: 500,
              maxDelay: 3000
          }
      );
      
      if (error) {
        console.error('Error adding Bluesky post:', error);
        continue;
      }
      
      results.added.push(result);
    }

    console.log('Post processing complete:', {
      total: data.posts.length,
      added: results.added.length,
      skipped: results.skipped.length
    });

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
