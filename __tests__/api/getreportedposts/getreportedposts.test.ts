import type { Server } from "http";
import type { AddressInfo } from "net";
import request from "supertest";
import { describe, beforeAll, afterAll, it, expect } from "@jest/globals";

// I import the 'mocked' server file, in order to setup the test.
import { setupServer } from "../../../servertest";

// This is used to allow the server to setup, 30 seconds is a magic number.
// jest.setTimeout(30000)

// Name this however, I call it like this
describe("Testing the GET reported posts API", () => {
  let server: Server
  let baseUrl: string

  // Start the server before all API tests.
  beforeAll(async () => {
    try {
      // Setup the server for testing
      server = await setupServer();

      /**
       * For some reason Jest gives you random ports, so in order to fix this,
       * we need to create the server ourselves and assign the port Jest gives.
       */
      const address = server.address() as AddressInfo;
      baseUrl = `http://localhost:${address.port}`;
      console.log(`Test server running at ${baseUrl}`);
    } catch (error) {
      console.error("Failed to start test server:", error);
      throw error
    }
  })

  // Close the server after all tests
  afterAll((done) => {
    if (server && server.listening) {
      server.close(() => {
        console.log("Test server closed");
        done()
      })
    } else {
      console.log("No server to close");
      done()
    }
  })

  /**
   * The console logs are not necessary for the test, you may remove
   * it if you wish.
   */

  describe("GET /api/getreportedposts", () => {
    it("should return 200 and a list of reported posts", async () => {
      const response = await request(baseUrl).get("/api/getreportedposts");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.posts)).toBe(true);

      console.log("[REPORTED POSTS]:", response.body.posts);

      if (response.body.posts.length > 0) {
        const post = response.body.posts[0];
        expect(post).toHaveProperty("id");
        expect(post).toHaveProperty("title");
        expect(post).toHaveProperty("text");
        expect(post).toHaveProperty("createdAt");
        expect(post).toHaveProperty("username");
        expect(post).toHaveProperty("postType");
        expect(Array.isArray(post.reports)).toBe(true);

        const report = post.reports[0];
        expect(report).toHaveProperty("reportedBy");
        expect(report).toHaveProperty("reason");
        expect(report).toHaveProperty("timestamp");
      }
    });

    it("should return an empty array if there are no reported posts", async () => {
      const response = await request(baseUrl).get("/api/getreportedposts");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.posts)).toBe(true);
    });
  });
});