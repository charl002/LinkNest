import firebase_app from "../config";
import { getFirestore, doc, updateDoc } from "@firebase/firestore";

const db = getFirestore(firebase_app);

interface UpdateStatusResult {
    success: boolean;
    error?: string;
}

export async function updateFriendRequestStatus(
    requestId: string,
    status: string
): Promise<UpdateStatusResult> {
    try {
        const docRef = doc(db, "friend_requests", requestId);
        await updateDoc(docRef, { status });

        return { success: true };
    } catch (error) {
        console.error("Error updating friend request status:", error);
        return { success: false, error: (error as Error).message };
    }
}
