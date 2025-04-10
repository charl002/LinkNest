import type { Server } from "http";
import type { AddressInfo } from "net";
import request from "supertest";
import { describe, beforeAll, afterAll, it, expect } from "@jest/globals";

// I import the 'mocked' server file, in order to setup the test.
import { setupServer } from "../../../servertest";

// This is used to allow the server to setup, 30 seconds is a magic number.
// jest.setTimeout(30000)

// Name this however, I call it like this
describe("Testing the GET single user API", () => {
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

  describe("GET /api/getsingleuser", () => {
    // This checks if the API route returns correct data.
    it("should return a 200 response with the expected data", async () => {
      try {
        const response = await request(baseUrl)
          .get("/api/getsingleuser")
          .query({ username: "mintthers" }); // passing the username as a query parameter
  
        expect(response.status).toBe(200);
        expect(response.body.data.username).toBe("mintthers");
        expect(response.body.data.email).toBe("mintthiha@gmail.com");
      } catch (error) {
        console.error("Test request failed:", error);
        throw error;
      }
    });

    // IF you don't put the username or email, a 400 is thrown. (Bad Request!)
    it("should return 400 if the username is missing", async () => {
      const response = await request(baseUrl).get("/api/getsingleuser");
      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Either email or username parameter is required");
    });
    
    // If the username does not exist in the db, it will return 404.
    it("should return 404 if the username does not exist", async () => {
      const response = await request(baseUrl)
        .get("/api/getsingleuser")
        .query({ username: "nonexistentuser" });
    
      expect(response.status).toBe(404);
      expect(response.body.message).toBe("User not found");
    });

    // Test if the GET single user is case sensitive
    it("should return the correct user regardless of case", async () => {
      const response = await request(baseUrl)
        .get("/api/getsingleuser")
        .query({ username: "MintThers" }); // Case sensitive username
    
      expect(response.status).toBe(404);
      expect(response.body.message).toBe("User not found");
    });
    
    // This should return 400 since we are passing an invalid parameter
    it("should return 400 if there are invalid query parameters", async () => {
      const response = await request(baseUrl)
        .get("/api/getsingleuser")
        .query({ invalidParam: "value" });
    
      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Either email or username parameter is required");
    });
    
    // Check structure
    it("should return the user with the expected structure", async () => {
      const response = await request(baseUrl)
        .get("/api/getsingleuser")
        .query({ username: "mintthers" });
    
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty("username");
      expect(response.body.data).toHaveProperty("email");
      expect(response.body.data).toHaveProperty("name");
    });
    
    // Check if the username empty, should throw error.
    it("should return 400 for an empty username", async () => {
      const response = await request(baseUrl)
        .get("/api/getsingleuser")
        .query({ username: "" });
    
      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Either email or username parameter is required");
    });
  });
});