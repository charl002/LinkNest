import firebase_app from "../config";
import { getFirestore, collection, addDoc } from "@firebase/firestore";

const db = getFirestore(firebase_app);

interface AddDataResult {
    result: string | null; // Return document ID
    error: Error | null;
}

export default async function addData(
    collectionName: string,
    data: Record<string, unknown>
): Promise<AddDataResult> {
    let result: string | null = null;
    let error: Error | null = null;

    try {
        const docRef = await addDoc(collection(db, collectionName), data);
        result = docRef.id; // Firestore-generated ID
    } catch (e) {
        console.log(e);
        error = e as Error;
    }

    return { result, error };
}
