import type { Server } from "http";
import type { AddressInfo } from "net";
import request from "supertest";
import { describe, beforeAll, afterAll, it, expect } from "@jest/globals";

// Import the mocked server setup function
import { setupServer } from "../../../servertest";

describe("Testing the GET status API", () => {
  let server: Server;
  let baseUrl: string;

  // Start the server before all API tests.
  beforeAll(async () => {
    try {
      server = await setupServer();
      const address = server.address() as AddressInfo;
      baseUrl = `http://localhost:${address.port}`;
      console.log(`Test server running at ${baseUrl}`);
    } catch (error) {
      console.error("Failed to start test server:", error);
      throw error;
    }
  });

  // Close the server after all tests
  afterAll((done) => {
    if (server && server.listening) {
      server.close(() => {
        console.log("Test server closed");
        done();
      });
    } else {
      console.log("No server to close");
      done();
    }
  });

  describe("GET /api/gethealth", () => {
    it("should return a 200 response with the expected data", async () => {
      try {
        const response = await request(baseUrl).get("/api/gethealth");

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("status", "OK");
        expect(response.body).toHaveProperty("timestamp");
        console.log(response.body);
      } catch (error) {
        console.error("Test request failed:", error);
        throw error;
      }
    });
  });
});
