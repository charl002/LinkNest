import type { Server } from "http";
import type { AddressInfo } from "net";
import request from "supertest";
import { describe, beforeAll, afterAll, it, expect } from "@jest/globals";

// Import the mocked server setup
import { setupServer } from "../../../servertest";

describe("Testing the GET message API", () => {
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

  describe("GET /api/getmessage", () => {

    it("should return 400 if messageId is missing", async () => {
      const response = await request(baseUrl).get("/api/getmessage");
      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Message ID is required.");
    });

    it("should return 404 if messageId does not exist", async () => {
      const response = await request(baseUrl)
        .get("/api/getmessage")
        .query({ messageId: "nonexistent" });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe("Message not found.");
    });

    it("should return 400 for an empty messageId", async () => {
      const response = await request(baseUrl)
        .get("/api/getmessage")
        .query({ messageId: "" });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe("Message ID is required.");
    });
  });
});
