import 'dotenv/config';
import { schedule } from 'node-cron';
import fetch from 'node-fetch';
import http from 'http';

const APP_URL = process.env.APP_URL;
const PORT = process.env.PORT || 3001;

// Create HTTP server for health checks
const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200);
        res.end('OK');
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(PORT, () => {
    console.log(`Health check server listening on port ${PORT}`);
});

async function fetchWithRetry(url, options, maxAttempts = 3) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const response = await fetch(url, options);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return { success: true, data };
        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error.message);
            
            if (attempt === maxAttempts) {
                return { success: false, error: error.message };
            }
            
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => 
                setTimeout(resolve, Math.min(1000 * Math.pow(2, attempt), 5000))
            );
        }
    }
}

async function fetchData() {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] Starting data fetch...`);

    // Fetch news
    console.log('Fetching news...');
    const newsResult = await fetchWithRetry(`${APP_URL}/api/news/postnews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });
    
    if (newsResult.success) {
        console.log('News fetch result:', {
            added: newsResult.data.results?.added?.length || 0,
            skipped: newsResult.data.results?.skipped?.length || 0
        });
    } else {
        console.error('News fetch failed:', newsResult.error);
    }

    // Fetch Bluesky posts
    console.log('Fetching Bluesky posts...');
    const blueskyResult = await fetchWithRetry(`${APP_URL}/api/bluesky/postbluesky`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    });
    
    if (blueskyResult.success) {
        console.log('Bluesky fetch result:', {
            added: blueskyResult.data.results?.added?.length || 0,
            skipped: blueskyResult.data.results?.skipped?.length || 0
        });
    } else {
        console.error('Bluesky fetch failed:', blueskyResult.error);
    }

    console.log(`[${timestamp}] Data fetch complete\n`);
}

// Run every hour at minute 0
schedule('0 * * * *', async () => {
    try {
        await fetchData();
    } catch (error) {
        console.error('Cron job failed:', error);
    }
});

// Also run immediately on startup
fetchData().catch(console.error);

console.log('Cron server started. Will fetch data every hour.'); 

// Add process termination handlers
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    server.close(() => {
        process.exit(0);
    });
});

// .env :
//      APP_URL=[app url]
//      NEWS_API_TOKEN=[news api token]
//      BLUESKY_USERNAME=[bluesky username]
//      BLUESKY_PASSWORD=[bluesky password]