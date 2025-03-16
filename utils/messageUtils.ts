// utils/messageUtils.ts

import { Socket } from "socket.io-client";

export const postMessageAndUnread = async (
  sender: string,
  receiver: string,
  message: string,
  isCallMsg: boolean
) => {
  try {
    // Post message to the API
    const postMessageResponse = await fetch("/api/postmessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        senderUsername: sender,
        receiverUsername: receiver,
        message: message,
        isCallMsg: isCallMsg,
      }),
    });

    const postMessageData = await postMessageResponse.json();
    // if (!postMessageResponse.ok) {
    //   console.error(`Error storing message: ${postMessageData.message}`);
    //   return;
    // }

    // Post unread message count to the API
    await fetch("/api/postunreadmessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: sender,
        receiver: receiver,
        count: 1, // Increment unread count if the user is offline
      }),
    });

    // Returns the doc ID of the message.
    return postMessageData;

  } catch (error) {
    console.error("Error storing message or unread message:", error);
  }
};

export const emitPrivateMessage = (socket: Socket, sender: string, receiver: string, message: string, docId: string, isCallMsg: boolean ) => {
  socket.emit("privateMessage", {
    senderId: sender,
    receiverId: receiver,
    message: message,
    msgId: docId,
    isCallMsg: isCallMsg
  });
};