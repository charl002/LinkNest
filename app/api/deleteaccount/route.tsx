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

        // Query Firestore for posts
        const postsRef = collection(db, "posts");
        const postsQuery = query(postsRef, where("username", "==", username));
        const postsSnapshot = await getDocs(postsQuery);

        // Query Firestore for images
        const imagesRef = collection(db, "images");
        const imagesQuery = query(imagesRef, where("imageName", "==", username));
        const imagesSnapshot = await getDocs(imagesQuery);

        // Delete all images from Firestore and Azure Blob Storage
        const deleteImagePromises = imagesSnapshot.docs.map(async (imageDoc) => {
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

        await Promise.all(deleteImagePromises);

        // Delete all posts associated with the username
        const deletePostPromises = postsSnapshot.docs.map(async (postDoc) => {
            await deleteDoc(doc(db, "posts", postDoc.id));
        });

        await Promise.all(deletePostPromises);

        // Delete user account
        const deleteUserPromises = userSnapshot.docs.map(async (userDoc) => {
            await deleteDoc(doc(db, "users", userDoc.id));
        });

        await Promise.all(deleteUserPromises);

        return NextResponse.json({ message: "User, associated posts, and images deleted successfully" }, { status: 200 });

    } catch (err) {
        console.error("Error deleting account:", err);
        return NextResponse.json({ message: "Unexpected error occurred", error: err }, { status: 500 });
    }
}
