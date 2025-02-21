import { NextResponse } from "next/server";
import addData from "@/firebase/firestore/addData";
import { getAllDocuments } from "@/firebase/firestore/getData";
import { GET as getNews } from "../getnews/route";

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

    const { results: existingNewsDocs, error: fetchError } = await getAllDocuments('news');
    
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
        likes: 0
      };

      const { result, error } = await addData('news', newsItemWithLikes);
      
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