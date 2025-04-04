/**
 * @route POST /api/news/postnews
 * @description Fetches external news data from the News API via the internal GET endpoint,
 *              checks Firestore for existing entries by UUID, and adds new news items with
 *              initialized `likes`, `likedBy`, `comments`, and `createdAt` fields.
 *              Skips already existing items to avoid duplication.
 *
 * @returns {201 Created} If new news items were successfully added to the Firestore.
 * @returns {200 OK} If all news items were already present and none were added.
 * @returns {500 Internal Server Error} If an error occurs during the fetch or write process.
 *
 * @notes Uses exponential backoff (`withRetry`) for robustness during Firestore and fetch operations.
 *        Relies on the `GET /api/news/getnews` endpoint as its data source.
 */
import { NextResponse } from "next/server";
import addData from "@/firebase/firestore/addData";
import { getAllDocuments } from "@/firebase/firestore/getData";
import { GET as getNews } from "../getnews/route";
import { withRetry } from '@/utils/backoff';

interface Results {
  added: (string | null)[];
  skipped: string[];
}

export async function POST() {
  try {
    const response = await getNews();
    if (!(response instanceof NextResponse)) {
      throw new Error('Invalid response from news API');
    }

    const data = await response.json();
    
    if (!data || !data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid news data format');
    }

    const { results: existingNewsDocs, error: fetchError } = await withRetry(
        () => getAllDocuments('news'),
        {
            maxAttempts: 3,
            initialDelay: 1000,
            maxDelay: 5000
        }
    );
    
    if (fetchError) {
      throw new Error('Failed to fetch existing news');
    }

    const existingUuids = new Set(
      existingNewsDocs?.docs.map(doc => doc.data().uuid) || []
    );

    const results: Results = {
      added: [],
      skipped: []
    };

    for (const newsItem of data.data) {
      if (existingUuids.has(newsItem.uuid)) {
        results.skipped.push(newsItem.uuid);
        continue;
      }

      // Add likes field to the news item
      const newsItemWithLikes = {
        ...newsItem,
        comments: [],
        likes: 0,
        likedBy: [],
        createdAt: newsItem.published_at
      };

      const { result, error } = await withRetry(
          () => addData('news', newsItemWithLikes),
          {
              maxAttempts: 3,
              initialDelay: 500,
              maxDelay: 3000
          }
      );
      
      if (error) {
        console.error('Error adding news item:', error);
        continue;
      }
      
      results.added.push(result);
    }

    if (results.added.length === 0) {
      return NextResponse.json(
        { 
          message: 'No new items added', 
          skipped: results.skipped.length,
          results 
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { 
        message: `Successfully added ${results.added.length} news items`, 
        skipped: results.skipped.length,
        results 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error in POST /api/news/postnews:', error);
    return NextResponse.json(
      { message: 'An error occurred', error },
      { status: 500 }
    );
  }
}

// fetch('/api/news/postnews', {
//   method: 'POST'
// }).then(res => res.json()).then(console.log)