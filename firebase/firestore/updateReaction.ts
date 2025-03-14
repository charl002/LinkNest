import firebase_app from "../config";
import { getFirestore, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "@firebase/firestore";

const db = getFirestore(firebase_app);

interface UpdateDataResult {
    result: string | null;
    error: Error | null;
}

export default async function updateReaction(
    collectionName: string,
    objectId: string,
    field: string,
    data: { user: string; reaction: string }
): Promise<UpdateDataResult> {
    let result: string | null = null;
    let error: Error | null = null;

    try {
        const postRef = doc(db, collectionName, objectId);
        const postSnap = await getDoc(postRef);

        if (!postSnap.exists()) {
            return { result: null, error: new Error("Document not found") };
        }

        const postData = postSnap.data();
        const reactions = postData[field] || []; 

        const existingReaction = reactions.find((r: { user: string }) => r.user === data.user);

        if (existingReaction) {
            await updateDoc(postRef, {
                [field]: arrayRemove(existingReaction),
            });
        }

        await updateDoc(postRef, {
            [field]: arrayUnion(data),
        });

        result = postRef.id;
    } catch (e) {
        console.error(e);
        error = e as Error;
    }

    return { result, error };
}
