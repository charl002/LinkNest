import firebase_app from "../config";
import { getFirestore, doc, getDoc, DocumentData, DocumentSnapshot, getDocs, QuerySnapshot, collection } from "@firebase/firestore";

const db = getFirestore(firebase_app);

interface GetDocumentResult {
    result: DocumentSnapshot<DocumentData> | null;
    error: unknown;
}

interface GetFriendRequestsResult {
  requests: DocumentData[] | null;
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

// WIll use this temporarely

export async function getFriendRequests(): Promise<GetFriendRequestsResult> {
  const colRef = collection(db, "friend_requests");

  let requests: DocumentData[] | null = null;
  let error: unknown = null;

  try {
      const snapshot: QuerySnapshot<DocumentData> = await getDocs(colRef);
      requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); // Convert docs to objects
  } catch (e) {
      error = e;
  }

  return { requests, error };
}
