import firebase_app from "../config";
import { getFirestore, collection, doc, setDoc, addDoc } from "@firebase/firestore";

const db = getFirestore(firebase_app);

interface AddDataResult {
    result: string | null; // Return document ID
    error: Error | null;
}

export default async function addData(
    collectionName: string,
    data: Record<string, unknown>,
    docId?: string // Optional custom document ID
): Promise<AddDataResult> {
    let result: string | null = null;
    let error: Error | null = null;

    try {
        if (docId) {
            // 🔹 Use custom `docId` if provided
            const docRef = doc(collection(db, collectionName), docId);
            await setDoc(docRef, data);
            result = docId;
        } else {
            // 🔹 Auto-generate `docId` if not provided
            const docRef = await addDoc(collection(db, collectionName), data);
            result = docRef.id;
        }
    } catch (e) {
        console.log(e);
        error = e as Error;
    }

    return { result, error };
}