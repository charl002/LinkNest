import { BskyAgent, AppBskyFeedDefs, AppBskyEmbedImages } from '@atproto/api'
import { NextResponse } from 'next/server'
import { withRetry } from '@/utils/backoff';
import cache from '@/lib/cache'

export async function GET() {
    //check cache first
    const cachedPosts = cache.get('bluesky-posts');
    if(cachedPosts){
        return NextResponse.json(cachedPosts);
    }

    try {
        const agent = new BskyAgent({
            service: 'https://bsky.social'
        });

        await withRetry(
            async () => agent.login({
                identifier: process.env.BLUESKY_USERNAME!,
                password: process.env.BLUESKY_PASSWORD!
            }),
            {
                maxAttempts: 3,
                initialDelay: 1000,
                maxDelay: 5000
            }
        );

        const response = await withRetry(
            () => agent.app.bsky.feed.getFeed({
                feed: 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot',
                limit: 100
            }),
            {
                maxAttempts: 3,
                initialDelay: 1000,
                maxDelay: 5000
            }
        );
        
        console.log('Feed response:', {
            feedLength: response.data.feed.length,
            cursor: response.data.cursor
        })

        const shuffledPosts = [...response.data.feed]
            .sort(() => Math.random() - 0.5)
            .slice(0, 50)

        const posts = shuffledPosts.map((item: AppBskyFeedDefs.FeedViewPost) => ({
            id: item.post.id,
            text: (item.post.record as AppBskyFeedDefs.PostView).text,
            createdAt: (item.post.record as AppBskyFeedDefs.PostView).createdAt,
            author: {
                handle: item.post.author.handle,
                displayName: item.post.author.displayName,
                avatar: item.post.author.avatar
            },
            images: (item.post.embed as AppBskyEmbedImages.View)?.images?.map(img => ({
                url: img.fullsize,
                alt: img.alt,
                thumb: img.thumb
            })) || []
        }))

        const result = { success: true, posts };

        // Store in cache
        cache.set('bluesky-posts', result);

        return NextResponse.json(result);

    } catch (error: unknown) {
        const err = error as Error;
        console.error('Detailed error:', {
            message: err.message,
            stack: err.stack,
            name: err.name
        });
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}