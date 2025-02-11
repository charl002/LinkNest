import firebase_app from "../config";
import { getFirestore, doc, getDoc, DocumentData, DocumentSnapshot, getDocs, QuerySnapshot, collection } from "@firebase/firestore";

const db = getFirestore(firebase_app);

interface GetDocumentResult {
    result: DocumentSnapshot<DocumentData> | null;
    error: unknown;
}

export async function getDocument(collection: string, id: string): Promise<GetDocumentResult> {
    const docRef = doc(db, collection, id);

    let result: DocumentSnapshot<DocumentData> | null = null;
    let error: unknown = null;

    try {
        result = await getDoc(docRef);
    } catch (e) {
        error = e;
    }

    return { result, error };
}

interface GetAllDocumentsResult {
    results: QuerySnapshot<DocumentData> | null;
    error: unknown;
}

export async function getAllDocuments(collectionName: string): Promise<GetAllDocumentsResult> {
    const colRef = collection(db, collectionName);

    let results: QuerySnapshot<DocumentData> | null = null;
    let error: unknown = null;

    try {
        results = await getDocs(colRef);
    } catch (e) {
        error = e;
    }

    return { results, error };
}
