import firebase_app from "../config";
import { getFirestore, doc, updateDoc, increment } from "firebase/firestore";

// Initialize Firestore
const db = getFirestore(firebase_app);

export async function incrementLikes(id: string, type: 'posts' | 'bluesky' | 'news', shouldIncrement: boolean = true): Promise<string> {
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
            likes: shouldIncrement ? increment(1) : increment(-1)
        });
        return 'Likes updated successfully';
    } catch (error) {
        console.error('Error updating likes:', error);
        throw new Error('Error updating likes');
    }
}
