import type { Server } from "http";
import type { AddressInfo } from "net";
import request from "supertest";
import { describe, beforeAll, afterAll, it, expect } from "@jest/globals";

// I import the 'mocked' server file, in order to setup the test.
import { setupServer } from "../../../servertest";

// This is used to allow the server to setup, 30 seconds is a magic number.
// jest.setTimeout(30000)

// Name this however, I call it like this
describe("Testing the GET friends API", () => {
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

  describe("GET /api/getfriends", () => {
    it("should return ['Badat18'] when username is 'mintthers'", async () => {
      const response = await request(baseUrl)
        .get("/api/getfriends")
        .query({ username: "mintthers" });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.friends)).toBe(true);
      expect(response.body.friends).toEqual(expect.arrayContaining(["Badat18"]));
    });

    it("should return ['mintthers'] & ['BalkaSingh'] when username is 'Badat18'", async () => {
      const response = await request(baseUrl)
        .get("/api/getfriends")
        .query({ username: "Badat18" });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.friends)).toBe(true);
      expect(response.body.friends).toEqual(expect.arrayContaining(["mintthers", "BalkaSingh"]));

    });
    
    it("should return 400 when no username is provided", async () => {
      const response = await request(baseUrl).get("/api/getfriends");

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Username parameter is required");
    });
  });
});

