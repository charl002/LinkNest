import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.WEBSITE_HOSTNAME || 'localhost';
const port = Number(process.env.PORT) || 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const userSockets: Record<string, string> = {}; // Store userSocket mapping (username to socketId)

const server = createServer((req, res) => {
  const parsedUrl = parse(req.url!, true);
  handle(req, res, parsedUrl);
});

app.prepare().then(() => {
  // Create a new Socket.IO server
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*", // Allow all origins (you can restrict this in production)
      methods: ["GET", "POST"] // Allow only GET and POST methods
    }
  });

  // Handle initial socket connection
  io.on("connection", (socket) => {
    console.log("User connected", socket.id);

    // Register the user to their socket ID
    socket.on("register", (userId) => {
      userSockets[userId] = socket.id;
      console.log(`User ${userId} connected with socket ID ${socket.id}`);
    });

    // Handle private messages or group messages
    socket.on("privateMessage", ({ senderId, message, msgId, isCallMsg, receiverId, groupId, receiversIds }) => {
      if(receiversIds && receiversIds.length > 0){ //////////// Remove this, mght be redundant
        receiversIds.forEach((groupReceiverId: string) => {
          const receiverSocketId = userSockets[groupReceiverId];
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("groupMessage", {
              senderId,
              groupReceiverId,
              message,
              msgId,
              isCallMsg,
              groupId
            });
          }
        });
      } else {
        const receiverSocketId = userSockets[receiverId];
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("privateMessage", { senderId, receiverId, message, msgId, isCallMsg });
        }
      }
    });

    //Handle group message
    socket.on("groupMessage", ({ senderId, message, msgId, isCallMsg, groupId, receiversIds }) => {
      if(receiversIds && receiversIds.length > 0){
        receiversIds.forEach((groupReceiverId: string) => {
          const receiverSocketId = userSockets[groupReceiverId];
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("groupMessage", {
              senderId,
              groupReceiverId,
              message,
              msgId,
              isCallMsg,
              groupId
            });
          }
        });
      }
    });

    // For some reason this socket does not work on prod, but works on dev. Will look into it another time.
    socket.on("call", ({ senderId, receiverId }) => {
      const receiverSocketId = userSockets[receiverId];
      if (receiverSocketId) {
        console.log('CALL USERID ', receiverSocketId);
        io.to(receiverSocketId).emit("call", { message: `${senderId} is calling you!` });
      }
    });

    // Listens for new friend requests.
    socket.on("newFriendRequest", ({ senderUsername, receiverUsername }) => {
      console.log(`New friend request from ${senderUsername} to ${receiverUsername}`);
      const receiverSocketId = userSockets[receiverUsername];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newFriendRequest", { senderUsername: senderUsername });
      } else {
        console.log(`User ${receiverUsername} is not online`);
      }
    });

    // Listens for when a friend request is accepted.
    socket.on("friendAccepted", ({ sender, receiver }) => {
      console.log(`Friend request accepted! ${sender} and ${receiver} are now friends.`);
    
      if (!sender || !receiver) {
        console.error("Invalid data for friendAccepted event:", { sender, receiver });
        return;
      }
    
      const receiverSocketId = userSockets[receiver]; // Receiver who accepted the request
      const senderSocketId = userSockets[sender]; // Sender who originally sent the request
    
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

    // Delete the pair from the list of socket - usernames
    socket.on("disconnect", () => {
      Object.keys(userSockets).forEach((userId) => {
        if (userSockets[userId] === socket.id) {
          delete userSockets[userId];
          console.log(`User ${userId} disconnected`);
        }
      });
    });
  });

  // CLeanup.
  server.once("error", (err) => {
    console.error(err);
    process.exit(1);
  })
  .listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});

export default server;