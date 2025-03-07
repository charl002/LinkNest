import { getFirestore, doc, deleteDoc } from "firebase/firestore";
import firebase_app from "@/firebase/config";

const db = getFirestore(firebase_app);

export default async function deleteData(collectionName: string, docId: string) {
    try {
        const docRef = doc(db, collectionName, docId);
        await deleteDoc(docRef);
        return { success: true };
    } catch (error) {
        console.error("Error deleting document:", error);
        return { success: false, error };
    }
}
