/**
 * @route GET /api/getmessages
 * @description Retrieves a list of messages between a sender and receiver (for private chat), or for a specific group (for group chat).
 *
 * @query {string} sender - The username of the user making the request (must match the authenticated user).
 * @query {string} receiver - (Optional) The username of the other user in the private chat.
 * @query {string} groupId - (Optional) The ID of the group chat (used instead of receiver).
 *
 * @returns {200 OK} JSON containing an array of messages sorted by date.
 * @returns {400 Bad Request} If required parameters are missing (sender, and either receiver or groupId).
 * @returns {401 Unauthorized} If the user is not authenticated.
 * @returns {403 Forbidden} If the sender in the query does not match the authenticated user.
 * @returns {404 Not Found} If the user is not found in the Firestore database.
 * @returns {500 Internal Server Error} If an error occurs during data fetching or processing.
 */
import { NextResponse } from "next/server";
import { getAllDocuments } from "@/firebase/firestore/getData";
import { auth } from "@/lib/auth";
import { withRetry } from '@/utils/backoff';

interface Message {
    id: string;
    sender: string;
    receiver: string;
    message: string;
    seen: boolean;
    date: Date;
    isCallMsg: boolean;
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const sender = searchParams.get("sender");
        const receiver = searchParams.get("receiver");
        const groupId = searchParams.get("groupId"); //For group messages.
        const session = await auth();

        if (!session || !session.user) {
          return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { results: getUsersResults, error: getUsersError } = await withRetry(
          () => getAllDocuments("users"),
          {
            maxAttempts: 3,
            initialDelay: 500,
            maxDelay: 3000
          }
        );

        if (getUsersError || !getUsersResults) {
          console.error("Error fetching users:", getUsersError);
          return NextResponse.json({ message: "Error fetching messages", error: getUsersError }, { status: 500 });
        }

        const sessionUser = getUsersResults.docs.find(doc => doc.data().email === session.user?.email);
        
        if (!sessionUser) {
          return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        if (sender !== sessionUser.data().username) {
          return NextResponse.json({ message: `You are not allowed to see these messages ${sender} n ${sessionUser.data().username}` }, { status: 403 });
        }

        if (!sender || (!receiver && !groupId)) {
          return NextResponse.json({ message: "Sender and receiver usernames are required" }, { status: 400 });
        }

        const { results, error } = await withRetry(
          () => getAllDocuments("messages"),
          {
            maxAttempts: 3,
            initialDelay: 500,
            maxDelay: 3000
          }
        );

        if (error || !results) {
            console.error("Error fetching messages:", error);
            return NextResponse.json({ message: "Error fetching messages", error }, { status: 500 });
        }

        if (results.empty) {
            return NextResponse.json({ messages: [], message: "No messages found" }, { status: 200 });
        }

        const messages: Message[] = results.docs
    .map(doc => {
        const data = doc.data();

        const isCall = data.isCallMsg || false;

              return {
                  id: doc.id,
                  sender: data.sender,
                  receiver: data.receiver,
                  message: data.message,
                  seen: data.seen,
                  date: new Date(data.date),
                  isCallMsg: isCall,
                  reactions: data.reactions,
                  groupId: data.groupId || null,
                  replyTo: data.replyTo || undefined
              };
          })
          .filter(msg => {
              const isPrivateMessage =
                  (msg.sender === sender && msg.receiver === receiver) ||
                  (msg.sender === receiver && msg.receiver === sender);
              
              const isGroupMessage = groupId && msg.groupId === groupId;

              // Ensure the message is either a private message or a group message with the correct groupId
              return (isPrivateMessage && !groupId) || isGroupMessage;
          })
          .sort((a, b) => a.date.getTime() - b.date.getTime());

      return NextResponse.json({ messages }, { status: 200 });

    } catch (error) {
      console.error("Server error:", error);
      return NextResponse.json({ 
        message: 'Error getting messages!', 
        error: error instanceof Error ? error.message : "Unknown error" 
      }, { status: 500 });
    }
}
