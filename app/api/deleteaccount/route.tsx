import { NextResponse } from "next/server";
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import firebase_app from "@/firebase/config";
import { BlobServiceClient } from "@azure/storage-blob";

const db = getFirestore(firebase_app);

// Azure Storage Configuration
const sasToken = process.env.AZURE_SAS;
const containerName = process.env.AZURE_BLOB_CONTAINER || "helloblob";
const storageAccountName = process.env.AZURE_STORAGE_ACCOUNT || "webprojazure";

const blobService = new BlobServiceClient(
  `https://${storageAccountName}.blob.core.windows.net/?${sasToken}`
);
const containerClient = blobService.getContainerClient(containerName);

export async function DELETE(req: Request) {
    try {
        const { username } = await req.json();

        if (!username) {
            return NextResponse.json({ message: "Username is required" }, { status: 400 });
        }

        // Query Firestore for user data
        const usersRef = collection(db, "users");
        const userQuery = query(usersRef, where("username", "==", username));
        const userSnapshot = await getDocs(userQuery);

        if (userSnapshot.empty) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // Query Firestore for friendships
        const friendsRef = collection(db, "friends");
        const friendsQuery = query(friendsRef, where("user1", "==", username));
        const friendsQuery2 = query(friendsRef, where("user2", "==", username));
        const [friendsSnapshot1, friendsSnapshot2] = await Promise.all([
            getDocs(friendsQuery),
            getDocs(friendsQuery2)
        ]);
        const allFriendDocs = [...friendsSnapshot1.docs, ...friendsSnapshot2.docs];

        // Query Firestore for friend requests
        const friendRequestsRef = collection(db, "friend_requests");
        const sentRequestsQuery = query(friendRequestsRef, where("senderUsername", "==", username));
        const receivedRequestsQuery = query(friendRequestsRef, where("receiverUsername", "==", username));
        const [sentRequestsSnapshot, receivedRequestsSnapshot] = await Promise.all([
            getDocs(sentRequestsQuery),
            getDocs(receivedRequestsQuery)
        ]);

        // Query Firestore for posts
        const postsRef = collection(db, "posts");
        const postsQuery = query(postsRef, where("username", "==", username));
        const postsSnapshot = await getDocs(postsQuery);

        // Query Firestore for images
        const imagesRef = collection(db, "images");
        const imagesQuery = query(imagesRef, where("imageName", "==", username));
        const imagesSnapshot = await getDocs(imagesQuery);

        // Query Firestore for messages where the sender or receiver is the username
        const messagesRef = collection(db, "messages");
        const sentMessagesQuery = query(messagesRef, where("sender", "==", username));
        const receivedMessagesQuery = query(messagesRef, where("receiver", "==", username));
        const [sentMessagesSnapshot, receivedMessagesSnapshot] = await Promise.all([
            getDocs(sentMessagesQuery),
            getDocs(receivedMessagesQuery)
        ]);

        // Query Firestore for friend requests where the sender or receiver is the username
        const unreadMessagesRef = collection(db, "unreadmessages");
        const sentUnreadQuery = query(unreadMessagesRef, where("sender", "==", username));
        const receivedUnreadQuery = query(unreadMessagesRef, where("receiver", "==", username));
        const [sentUnreadSnapshot, receivedUnreadSnapshot] = await Promise.all([
            getDocs(sentUnreadQuery),
            getDocs(receivedUnreadQuery)
        ]);

        // Delete all friend requests
        const deleteUnreadMessages = [...sentUnreadSnapshot.docs, ...receivedUnreadSnapshot.docs].map(
            async (requestDoc) => deleteDoc(doc(db, "unreadmessages", requestDoc.id))
        );

        // Delete all friend requests
        const deleteFriendRequests = [...sentRequestsSnapshot.docs, ...receivedRequestsSnapshot.docs].map(
            async (requestDoc) => deleteDoc(doc(db, "friend_requests", requestDoc.id))
        );

        // Delete all messages
        const deleteMessages = [...sentMessagesSnapshot.docs, ...receivedMessagesSnapshot.docs].map(
            async (messageDoc) => deleteDoc(doc(db, "messages", messageDoc.id))
        );

        // Delete all friendships
        const deleteFriendships = allFriendDocs.map(
            async (friendDoc) => deleteDoc(doc(db, "friends", friendDoc.id))
        );

        // Delete all images from Firestore and Azure Blob Storage
        const deleteImages = imagesSnapshot.docs.map(async (imageDoc) => {
            const imageData = imageDoc.data();
            const fileUrl = imageData.fileUrl;

            if (fileUrl) {
                try {
                    const blobName = fileUrl.split('/').pop();
                    const blobClient = containerClient.getBlockBlobClient(blobName!);
                    await blobClient.deleteIfExists();
                } catch (err) {
                    console.error("Failed to delete image from Azure:", err);
                }
            }

            await deleteDoc(doc(db, "images", imageDoc.id));
        });

        // Delete all posts
        const deletePosts = postsSnapshot.docs.map(
            async (postDoc) => deleteDoc(doc(db, "posts", postDoc.id))
        );

        // Delete user account
        const deleteUser = userSnapshot.docs.map(
            async (userDoc) => deleteDoc(doc(db, "users", userDoc.id))
        );

        // Execute all deletions in parallel
        await Promise.all([
            ...deleteFriendRequests,
            ...deleteUnreadMessages,
            ...deleteMessages,
            ...deleteFriendships,
            ...deleteImages,
            ...deletePosts,
            ...deleteUser
        ]);

        return NextResponse.json({ message: "User and all associated data deleted successfully" }, { status: 200 });

    } catch (err) {
        console.error("Error deleting account:", err);
        return NextResponse.json({ message: "Unexpected error occurred", error: err }, { status: 500 });
    }
}
