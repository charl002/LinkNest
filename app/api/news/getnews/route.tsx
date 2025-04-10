import { NextResponse } from "next/server";
import { withRetry } from '@/utils/backoff';

export async function GET() {
  try {
    const API_KEY = process.env.NEWS_API_TOKEN;
    
    const fetchNews = async () => {
      const response = await fetch(
        `https://api.thenewsapi.com/v1/news/top?api_token=${API_KEY}&locale=us&language=en`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`News API responded with status: ${response.status}`);
      }
      
      return response.json();
    };

    const data = await withRetry(fetchNews, {
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 5000
    });
    
    return NextResponse.json(data);
  }
  catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { 
        message: 'Failed to fetch news data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}