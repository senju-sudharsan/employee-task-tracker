import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

/* ===========================
   GET USER PROFILE
   (Enforces Deleted Blocking)
=========================== */
export const getUserProfile = async (uid) => {
  if (!uid) {
    throw new Error("Invalid user");
  }

  const userRef = doc(db, "users", uid);
  const snapshot = await getDoc(userRef);

  // If Firestore doc does not exist
  if (!snapshot.exists()) {
    throw new Error("User profile not found");
  }

  const data = snapshot.data();

  // 🚫 HARD BLOCK: Deleted users behave as non-existent
  if (data.status === "Deleted") {
    throw new Error("User profile not found");
  }

  // Optional: also block missing status (defensive programming)
  if (!data.status) {
    throw new Error("User profile not found");
  }

  return data;
};