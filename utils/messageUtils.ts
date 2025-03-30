import { Socket } from "socket.io-client";
import CryptoJS from "crypto-js";

const SECRET_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY!;

const encryptMessage = (message: string): string => {
  return CryptoJS.AES.encrypt(message, SECRET_KEY).toString();
};

export const postMessageAndUnread = async (
  sender: string,
  message: string,
  isCallMsg: boolean,
  receiver?: string,
  groupId?: string,
  receivers?: string[]    
) => {
  try {
    const encryptedMessage = encryptMessage(message);

    // Case 1: If there's a single receiver (private message)
    if (receiver) {
      const postMessageResponse = await fetch("/api/postmessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderUsername: sender,
          receiverUsername: receiver,
          message: encryptedMessage,
          isCallMsg: isCallMsg,
          groupId: null,       // Group ID is not needed for private messages
          receiversUsernames: null, // Receivers are null for private messages
        }),
      });

      const postMessageData = await postMessageResponse.json();

      await fetch("/api/postunreadmessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: sender,
          receiver: receiver,
          receivers: null,     // No receivers for private message
          count: 1,
          message: encryptedMessage,
        }),
      });

      return postMessageData;
    }

    // Case 2: If it's a group message
    if (groupId && receivers && receivers.length > 0) {
      const postMessageResponse = await fetch("/api/postmessage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderUsername: sender,
          receiverUsername: null,    // No single receiver for group
          message: encryptedMessage,
          isCallMsg: isCallMsg,
          groupId: groupId,          // Pass the group ID
          receiversUsernames: receivers, // List of group receivers
        }),
      });

      const postMessageData = await postMessageResponse.json();

      // Send the unread message data for all receivers in the group
      for (const receiver of receivers) {
        await fetch("/api/postunreadmessage", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: sender,
            receiver: receiver,
            receivers: receivers,
            count: 1,
            message: encryptedMessage,
          }),
        });
      }

      return postMessageData;
    }

    throw new Error("Receiver or group details are missing.");
  } catch (error) {
    console.error("Error storing message or unread message:", error);
  }
};

export const emitPrivateMessage = (
  socket: Socket,
  sender: string,
  receiver: string,
  message: string,
  docId: string,
  isCallMsg: boolean
) => {
  const encryptedMessage = encryptMessage(message);

  socket.emit("privateMessage", {
    senderId: sender,
    receiverId: receiver,
    message: encryptedMessage,
    msgId: docId,
    isCallMsg: isCallMsg,
  });
};
