import firebase_app from "../config";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

const db = getFirestore(firebase_app);

export async function incrementCommentLikes(id: string, type: 'posts' | 'bluesky' | 'news', shouldIncrement: boolean = true, username: string, commentIndex: number): Promise<string> {
    if (!id || commentIndex === undefined) {
        throw new Error('Missing id or commentIndex');
    }
    const collectionMap = {
        posts: 'posts',
        bluesky: 'bluesky',
        news: 'news'
    };
    const collectionName = collectionMap[type];
    const postRef = doc(db, collectionName, id);

    try {
        // First get the current document
        const docSnap = await getDoc(postRef);
        if (!docSnap.exists()) {
            throw new Error('Post not found');
        }

        const data = docSnap.data();
        const comments = [...data.comments];
        
        // Update the specific comment
        if (!comments[commentIndex].likedBy) {
            comments[commentIndex].likedBy = [];
        }
        
        const currentLikes = comments[commentIndex].likes || 0;
        comments[commentIndex].likes = shouldIncrement ? currentLikes + 1 : currentLikes - 1;
        
        if (shouldIncrement) {
            if (!comments[commentIndex].likedBy.includes(username)) {
                comments[commentIndex].likedBy.push(username);
            }
        } else {
            comments[commentIndex].likedBy = comments[commentIndex].likedBy.filter((user: string) => user !== username);
        }

        // Update the entire comments array
        await updateDoc(postRef, {
            comments: comments
        });

        return 'Comment likes updated successfully';
    } catch (error) {
        console.error('Error updating comment likes:', error);
        throw new Error('Error updating comment likes');
    }
}
