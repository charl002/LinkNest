import firebase_app from "../config";
import { getFirestore, doc, updateDoc, FieldValue } from "@firebase/firestore";

const db = getFirestore(firebase_app);

interface UpdateDataResult {
    result: string | null; // Return document ID
    error: Error | null;
}

export default async function updateData(
    collectionName: string,
    objectId: string,
    data: { [key: string]: FieldValue | Partial<unknown> | undefined }
): Promise<UpdateDataResult> {
    let result: string | null = null;
    let error: Error | null = null;

    try {
        const postRef = doc(db, collectionName, objectId);
        // ✅ Update Firestore document directly with `data` fields at the root level
        await updateDoc(postRef, data);
        
        result = postRef.id; // Firestore-generated ID
    } catch (e) {
        console.log(e);
        error = e as Error;
    }

    return { result, error };
}