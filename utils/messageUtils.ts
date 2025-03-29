import { Socket } from "socket.io-client";
import CryptoJS from "crypto-js";

const SECRET_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY!;

const encryptMessage = (message: string): string => {
  return CryptoJS.AES.encrypt(message, SECRET_KEY).toString();
};

export const postMessageAndUnread = async (
  sender: string,
  receiver: string,
  message: string,
  isCallMsg: boolean
) => {
  try {
    const encryptedMessage = encryptMessage(message);

    const postMessageResponse = await fetch("/api/postmessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderUsername: sender,
        receiverUsername: receiver,
        message: encryptedMessage,
        isCallMsg: isCallMsg,
      }),
    });

    const postMessageData = await postMessageResponse.json();

    await fetch("/api/postunreadmessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: sender,
        receiver: receiver,
        count: 1,
        message: encryptedMessage
      }),
    });

    return postMessageData;
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
