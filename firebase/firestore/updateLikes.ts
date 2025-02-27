import firebase_app from "../config";
import { getFirestore, doc, updateDoc, increment, arrayUnion, arrayRemove } from "firebase/firestore";

// Initialize Firestore
const db = getFirestore(firebase_app);

export async function incrementLikes(id: string, type: 'posts' | 'bluesky' | 'news', shouldIncrement: boolean = true, username: string): Promise<string> {
    if (!id || !type) {
        throw new Error('Missing id or type');
    }

    const collectionMap = {
        posts: 'posts',
        bluesky: 'bluesky',
        news: 'news'
    };

    const collectionName = collectionMap[type];

    if (!collectionName) {
        throw new Error('Invalid type');
    }

    const postRef = doc(db, collectionName, id);

    try {
        await updateDoc(postRef, {
            likes: shouldIncrement ? increment(1) : increment(-1),
            likedBy: shouldIncrement ? arrayUnion(username) : arrayRemove(username)
        });
        return 'Likes updated successfully';
    } catch (error) {
        console.error('Error updating likes:', error);
        throw new Error('Error updating likes');
    }
}
