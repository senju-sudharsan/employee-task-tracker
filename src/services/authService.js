import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export const getUserProfile = async (uid) => {
  const userRef = doc(db, "users", uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    throw new Error("User profile not found");
  }

  return snapshot.data();
};
