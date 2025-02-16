import { NextResponse } from "next/server";

export async function GET() {
  try {
    const API_KEY = process.env.NEWS_API_TOKEN;
    const response = await fetch(
      `https://api.thenewsapi.com/v1/news/top?api_token=${API_KEY}&locale=us&language=en`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    
    return NextResponse.json(data);
  }
  catch (error) {
    return NextResponse.json(
      { message: 'Failed to fetch news data' , error },
      { status: 500 }
    );
  }
}