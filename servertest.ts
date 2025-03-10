import { createServer, type Server } from "http"
import { parse } from "url"
import next from "next"
import { Server as SocketIOServer } from "socket.io"
import type { AddressInfo } from "net"

export async function setupServer(): Promise<Server> {
  // Use a different port for testing to avoid conflicts
  const port = 0 // Let the OS assign a free port
  const hostname = "localhost"

  // Create HTTP server first
  const server = createServer()

  // Always use test environment
  const dev = false
  const app = next({
    dev,
    hostname,
    port,
    customServer: true, // Important for testing with a custom server
  })

  const handle = app.getRequestHandler()

  // Track connected users
  const userSockets: Record<string, string> = {}

  // Setup Socket.IO
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  })

  // Handle socket connections
  io.on("connection", (socket) => {
    socket.on("register", (userId) => {
      userSockets[userId] = socket.id
    })

    socket.on("sendFriendRequest", ({ senderId, receiverId }) => {
      const receiverSocketId = userSockets[receiverId]
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("friendRequestReceived", {
          senderId,
          message: `${senderId} sent you a friend request!`,
        })
      }
    })

    socket.on("privateMessage", ({ senderId, receiverId, message }) => {
      const receiverSocketId = userSockets[receiverId]
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("privateMessage", { senderId, receiverId, message })
      }
    })

    socket.on("disconnect", () => {
      Object.keys(userSockets).forEach((userId) => {
        if (userSockets[userId] === socket.id) {
          delete userSockets[userId]
        }
      })
    })
  })

  // Set up request handler after Socket.IO is initialized
  server.on("request", (req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  // Wait for Next.js to prepare the app
  await app.prepare()

  // Start the server but don't block
  return new Promise<Server>((resolve) => {
    server.listen(port, hostname, () => {
      console.log(`Test server started on port ${(server.address() as AddressInfo).port}`)
      resolve(server)
    })
  })
}