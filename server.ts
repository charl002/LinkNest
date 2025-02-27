import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.WEBSITE_HOSTNAME || 'localhost';
const port = Number(process.env.PORT) || 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const userSockets: Record<string, string> = {};

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected", socket.id);

    socket.on("register", (userId) => {
      userSockets[userId] = socket.id;
      console.log(`User ${userId} connected with socket ID ${socket.id}`);
    });

    socket.on("sendFriendRequest", ({ senderId, receiverId }) => {
      const receiverSocketId = userSockets[receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("friendRequestReceived", {
          senderId,
          message: `${senderId} sent you a friend request!`,
        });
      } else {
        console.log(`User ${receiverId} not found or not connected`);
      }
    });

    socket.on("privateMessage", ({ senderId, receiverId, message }) => {
      const receiverSocketId = userSockets[receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("privateMessage", { senderId, message });
      }
    });

    socket.on("disconnect", () => {
      Object.keys(userSockets).forEach((userId) => {
        if (userSockets[userId] === socket.id) {
          delete userSockets[userId];
          console.log(`User ${userId} disconnected`);
        }
      });
    });
  });

  server.once("error", (err) => {
    console.error(err);
    process.exit(1);
  })
  .listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});