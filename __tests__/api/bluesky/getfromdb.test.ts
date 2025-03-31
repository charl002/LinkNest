import { Server, createServer } from 'http';
import { AddressInfo } from 'net';
import request from 'supertest';
import { GET } from '@/app/api/bluesky/getfromdb/route';
import cache from '@/lib/cache';

// Create a simpler test server
async function setupServer() {
  const server = createServer(async (req, res) => {
    if (req.url === '/api/bluesky/getfromdb') {
      const response = await GET();
      const data = await response.json();
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(0);
  return server;
}

jest.mock('@/firebase/firestore/getData', () => ({
  getAllDocuments: jest.fn().mockImplementation(() => ({
    results: {
      empty: false,
      docs: [
        {
          id: 'test-post-1',
          data: () => ({
            text: 'Test Bluesky Post',
            createdAt: '2024-01-01T00:00:00.000Z',
            author: {
              handle: 'test_user',
              displayName: 'Test User',
              avatar: 'https://example.com/avatar.jpg'
            },
            images: [
              {
                url: 'https://example.com/image.jpg',
                alt: 'Test Image',
                thumb: 'https://example.com/thumb.jpg'
              }
            ],
            likes: 10,
            likedBy: ['user1', 'user2'],
            comments: []
          })
        }
      ]
    }
  }))
}));

jest.setTimeout(30000);

// Mock console methods
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('Bluesky GetFromDB API', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    server = await setupServer();
    const address = server.address() as AddressInfo;
    baseUrl = `http://localhost:${address.port}`;
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    cache.flushAll();
  });

  it('should return cached data if available', async () => {
    const mockData = {
      success: true,
      posts: [{
        id: 'cached-post',
        title: 'Cached Post'
      }]
    };
    
    cache.set('bluesky-posts', mockData);
    
    const response = await request(baseUrl)  // Use baseUrl instead of server
      .get('/api/bluesky/getfromdb');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockData);
  });

  it('should fetch and return posts from Firestore when cache is empty', async () => {
    const response = await request(baseUrl)  // Use baseUrl instead of server
      .get('/api/bluesky/getfromdb');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.posts).toBeInstanceOf(Array);
    expect(response.body.posts[0]).toHaveProperty('title');
    expect(response.body.posts[0]).toHaveProperty('username');
    expect(response.body.posts[0]).toHaveProperty('description');
  });
});