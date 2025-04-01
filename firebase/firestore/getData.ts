import firebase_app from "../config";
import { getFirestore, doc, getDoc, DocumentData, DocumentSnapshot, getDocs, QuerySnapshot, collection, query, where } from "@firebase/firestore";

const db = getFirestore(firebase_app);

interface GetDocumentResult {
    result: DocumentSnapshot<DocumentData> | null;
    error: unknown;
}

interface GetDataResult {
  data: DocumentData[] | null;
  error: unknown;
}

interface QueryObject {
  field: string; // The field to filter by (e.g., 'members' or 'users')
  value: string; // The value to search for (e.g., the current user's username)
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

export async function getFriendRequests(): Promise<GetDataResult> {
  const colRef = collection(db, "friend_requests");

  let data: DocumentData[] | null = null;
  let error: unknown = null;

  try {
      const snapshot: QuerySnapshot<DocumentData> = await getDocs(colRef);
      data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); // Convert docs to objects
  } catch (e) {
      error = e;
  }

  return { data, error };
}

export async function getData(collectionName: string, queryObj: QueryObject): Promise<GetDataResult> {
  try {
      // Create a query with the 'members' field filter
      const colRef = collection(db, collectionName);
      const q = query(colRef, where("members", "array-contains", queryObj.value));

      // Get the query snapshot
      const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);
      
      // Map the documents into an array
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      return { data, error: null };
  } catch (error) {
      return { data: null, error };
  }
}