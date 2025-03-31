import { Server, createServer } from 'http';
import { AddressInfo } from 'net';
import request from 'supertest';
import { GET } from '@/app/api/news/getfromdb/route';
import cache from '@/lib/cache';

async function setupServer() {
  const server = createServer(async (req, res) => {
    if (req.url === '/api/news/getfromdb') {
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
          id: 'test-news-1',
          data: () => ({
            uuid: 'test-uuid',
            title: 'Test News Article',
            description: 'Test Description',
            keywords: 'news, test, article',
            url: 'https://example.com/news',
            image_url: 'https://example.com/image.jpg',
            createdAt: '2024-01-01T00:00:00.000Z',
            source: 'Test Source',
            likes: 5,
            likedBy: ['user1'],
            comments: []
          })
        }
      ]
    }
  }))
}));

jest.setTimeout(30000);

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('News GetFromDB API', () => {
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
        id: 'cached-news',
        title: 'Cached News Article'
      }]
    };
    
    cache.set('news-posts', mockData);
    
    const response = await request(baseUrl)
      .get('/api/news/getfromdb');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockData);
  });

  it('should fetch and return posts from Firestore when cache is empty', async () => {
    const response = await request(baseUrl)
      .get('/api/news/getfromdb');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.posts).toBeInstanceOf(Array);
    expect(response.body.posts[0]).toHaveProperty('title');
    expect(response.body.posts[0]).toHaveProperty('username');
    expect(response.body.posts[0]).toHaveProperty('description');
    expect(response.body.posts[0]).toHaveProperty('tags');
    expect(Array.isArray(response.body.posts[0].tags)).toBe(true);
  });
});