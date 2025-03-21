import { BskyAgent, AppBskyFeedDefs, AppBskyEmbedImages } from '@atproto/api'
import { NextResponse } from 'next/server'
import { withRetry } from '@/utils/backoff';

export async function GET() {
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

        // Add array of feed routes to try
        const feedRoutes = [
            'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot',
            'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/with-replies',
            'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/trending'
        ];

        interface Post {
            id: string;
            text: string;
            createdAt: string;
            author: {
                handle: string;
                displayName: string | null;
                avatar: string | null;
            };
            images: Array<{
                url: string;
                alt: string;
                thumb: string;
            }>;
        }

        let posts: Post[] = [];
        
        // Try each feed route until we get posts
        for (const feedRoute of feedRoutes) {
            const response = await withRetry(
                () => agent.app.bsky.feed.getFeed({
                    feed: feedRoute,
                    limit: 100
                }),
                {
                    maxAttempts: 3,
                    initialDelay: 1000,
                    maxDelay: 5000
                }
            );
            
            console.log(`Feed response for ${feedRoute}:`, {
                feedLength: response.data.feed.length,
                cursor: response.data.cursor
            });

            const shuffledPosts = [...response.data.feed]
                .sort(() => Math.random() - 0.5)
                .slice(0, 50);

            posts = shuffledPosts.map((item: AppBskyFeedDefs.FeedViewPost) => ({
                id: item.post.uri.split('/').pop() || item.post.cid,
                text: (item.post.record as AppBskyFeedDefs.PostView).text as string,
                createdAt: (item.post.record as AppBskyFeedDefs.PostView).createdAt as string,
                author: {
                    handle: item.post.author.handle,
                    displayName: item.post.author.displayName || null,
                    avatar: item.post.author.avatar || null
                },
                images: (item.post.embed as AppBskyEmbedImages.View)?.images?.map(img => ({
                    url: img.fullsize,
                    alt: img.alt,
                    thumb: img.thumb
                })) || []
            }));

            // If we got posts, break the loop
            if (posts.length > 0) {
                break;
            }
        }

        // If we still have no posts after trying all feeds, throw an error
        if (posts.length === 0) {
            throw new Error('No posts found in any feed');
        }

        return NextResponse.json({ success: true, posts });

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