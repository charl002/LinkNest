import type { Server } from "http";
import type { AddressInfo } from "net";
import request from "supertest";
import { describe, beforeAll, afterAll, it, expect } from "@jest/globals";

// Import the mocked server setup
import { setupServer } from "../../../servertest";

describe("Testing the GET messages API", () => {
  let server: Server;
  let baseUrl: string;

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

  describe("GET /api/messages", () => {

    it("should return 404 if the session user is not found", async () => {
      const response = await request(baseUrl)
        .get("/api/messages")
        .query({ sender: "unknownUser", receiver: "Xpert" });
      
      expect(response.status).toBe(404);
    });

  });
});
