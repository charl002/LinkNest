import type { Server } from "http";
import type { AddressInfo } from "net";
import request from "supertest";
import { describe, beforeAll, afterAll, it, expect } from "@jest/globals";

// I import the 'mocked' server file, in order to setup the test.
import { setupServer } from "../../../servertest";

// This is used to allow the server to setup, 30 seconds is a magic number.
// jest.setTimeout(30000)

// Name this however, I call it like this
describe("Testing the GET posts by username API", () => {
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

  describe("GET /api/getpostbyusername", () => {
    it("should return 200 and posts for username 'Xpert'", async () => {
      const response = await request(baseUrl)
        .get("/api/getpostbyusername")
        .query({ username: "Xpert" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.posts)).toBe(true);
      expect(response.body.posts.length).toBeGreaterThan(0);

      const post = response.body.posts[0];
      console.log("[POST RETURNED]:", post);

      expect(post).toHaveProperty("id");
      expect(post).toHaveProperty("username", "Xpert");
      expect(post).toHaveProperty("title");
      expect(post).toHaveProperty("description");
      expect(post).toHaveProperty("comments");
    });

    it("should return 200 and an empty posts array for an existing user with no posts", async () => {
      const response = await request(baseUrl)
        .get("/api/getpostbyusername")
        .query({ username: "BalkaSingh" });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.posts).toEqual([]);
    });

    it("should return 400 when username is missing", async () => {
      const response = await request(baseUrl).get("/api/getpostbyusername");

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Username parameter is required");
    });
  });
});