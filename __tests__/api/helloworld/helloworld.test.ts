import type { Server } from "http";
import type { AddressInfo } from "net";
import request from "supertest";
import { describe, beforeAll, afterAll, it, expect } from "@jest/globals";

// Import the setupServer function
import { setupServer } from "../../../servertest"

// Increase timeout for server setup
jest.setTimeout(30000)

describe("API Integration Tests", () => {
  let server: Server
  let baseUrl: string

  // Start the server before all tests
  beforeAll(async () => {
    try {
      // Setup the server for testing
      server = await setupServer()

      // Get the dynamically assigned port
      const address = server.address() as AddressInfo
      baseUrl = `http://localhost:${address.port}`
      console.log(`Test server running at ${baseUrl}`)
    } catch (error) {
      console.error("Failed to start test server:", error)
      throw error
    }
  })

  // Close the server after all tests
  afterAll((done) => {
    if (server && server.listening) {
      server.close(() => {
        console.log("Test server closed")
        done()
      })
    } else {
      console.log("No server to close")
      done()
    }
  })

  // Test the hello world API route
  describe("GET /api/helloworld", () => {
    it("should return a 200 response with the expected data", async () => {
      try {
        const response = await request(baseUrl).get("/api/helloworld")

        expect(response.status).toBe(200)
        expect(response.body).toEqual({ message: "Hello from API Route!" }) // Adjust based on your actual response
      } catch (error) {
        console.error("Test request failed:", error)
        throw error
      }
    })
  })
})