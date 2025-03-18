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

const server = createServer((req, res) => {
  const parsedUrl = parse(req.url!, true);
  handle(req, res, parsedUrl);
});

app.prepare().then(() => {
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

    socket.on("privateMessage", ({ senderId, receiverId, message, msgId, isCallMsg }) => {
      const receiverSocketId = userSockets[receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("privateMessage", { senderId, receiverId, message, msgId, isCallMsg });
      }
    });

    // Inside the socket connection
    socket.on("call", ({ senderId, receiverId }) => {
      const receiverSocketId = userSockets[receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("call", { senderId, message: `${senderId} is calling you!` });
      }
    });

    socket.on("newFriendRequest", ({ senderUsername, receiverUsername }) => {
      console.log(`New friend request from ${senderUsername} to ${receiverUsername}`);
    
      const receiverSocketId = userSockets[receiverUsername];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newFriendRequest", { senderUsername });
      } else {
        console.log(`User ${receiverUsername} is not online`);
      }
    });

    socket.on("friendAccepted", ({ sender, receiver }) => {
      console.log(`Friend request accepted! ${sender} and ${receiver} are now friends.`);
    
      if (!sender || !receiver) {
        console.error("Invalid data for friendAccepted event:", { sender, receiver });
        return;
      }
    
      const receiverSocketId = userSockets[receiver]; // Receiver who accepted the request
      const senderSocketId = userSockets[sender]; // Sender who originally sent the request
    
      console.log(`Receiver Socket ID: ${receiverSocketId}, Sender Socket ID: ${senderSocketId}`);
    
      if (receiverSocketId) {
        console.log(`Emitting friendRequestAccepted to ${receiver}`);
        io.to(receiverSocketId).emit("friendRequestAccepted", { acceptedBy: sender });
      }
    
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("updateFriendsList", { newFriend: sender });
      }
    
      if (senderSocketId) {
        io.to(senderSocketId).emit("updateFriendsList", { newFriend: receiver });
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

export default server;