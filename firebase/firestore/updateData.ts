import firebase_app from "../config";
import { getFirestore, doc, updateDoc, arrayUnion } from "@firebase/firestore";

const db = getFirestore(firebase_app);

interface UpdateDataResult {
    result: string | null; // Return document ID
    error: Error | null;
}

export default async function addData(
    collectionName: string,
    objectId: string,
    data: Record<string, unknown>
): Promise<UpdateDataResult> {
    let result: string | null = null;
    let error: Error | null = null;

    try{
        const postRef = doc(db, collectionName, objectId);

        await updateDoc(postRef, {
            comments: arrayUnion(data),
        });
        result = postRef.id; // Firestore-generated ID
    } catch (e) {
        console.log(e);
        error = e as Error;
    }

    return { result, error };
}