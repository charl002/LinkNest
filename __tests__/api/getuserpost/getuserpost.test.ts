import type { Server } from "http";
import type { AddressInfo } from "net";
import request from "supertest";
import { describe, beforeAll, afterAll, it, expect } from "@jest/globals";

// I import the 'mocked' server file, in order to setup the test.
import { setupServer } from "../../../servertest";

// This is used to allow the server to setup, 30 seconds is a magic number.
// jest.setTimeout(30000)

// Name this however, I call it like this
describe("Testing the GET all user posts API", () => {
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

  describe("GET /api/getuserpost", () => {
    it("should return a 200 response and log all user posts", async () => {
      try {
        const response = await request(baseUrl).get("/api/getuserpost");
        expect(response.status).toBe(200);
        // console.log("[POSTS RECEIVED]:", response.body.posts);
      } catch (error) {
        console.error("Test request failed:", error);
        throw error;
      }
    });
  });
});