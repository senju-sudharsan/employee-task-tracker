import { db, secondaryAuth } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
  updateDoc,
  getDoc
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

/* ===========================
   GET ALL USERS (Active Only)
=========================== */
export const getAllUsers = async () => {
  const snap = await getDocs(collection(db, "users"));

  return snap.docs
    .map(d => ({
      id: d.id,
      ...d.data()
    }))
    .filter(user => user.status === "Active");
};

/* ===========================
   CREATE EMPLOYEE
=========================== */
export const createEmployee = async ({
  name,
  email,
  password,
  organizationId,
  createdBy
}) => {
  if (!name || !email || !password || !organizationId) {
    throw new Error("All fields are required");
  }

  const cred = await createUserWithEmailAndPassword(
    secondaryAuth,
    email,
    password
  );

  const uid = cred.user.uid;

  await setDoc(doc(db, "users", uid), {
    uid,
    name,
    email,
    role: "employee",
    organizationId,
    status: "Active",
    createdBy,
    createdAt: serverTimestamp()
  });

  return uid;
};

/* ===========================
   CREATE ADMIN
=========================== */
export const createAdminUser = async ({
  name,
  email,
  password,
  organizationId,
  createdBy
}) => {
  if (!name || !email || !password || !organizationId) {
    throw new Error("All fields are required");
  }

  const cred = await createUserWithEmailAndPassword(
    secondaryAuth,
    email,
    password
  );

  const uid = cred.user.uid;

  await setDoc(doc(db, "users", uid), {
    uid,
    name,
    email,
    role: "admin",
    organizationId,
    status: "Active",
    createdBy,
    createdAt: serverTimestamp()
  });

  return uid;
};

/* ===========================
   SOFT DELETE USER (Hybrid Secure)
=========================== */
export const softDeleteUser = async ({
  targetUserId,
  currentUser
}) => {
  if (!targetUserId) {
    throw new Error("User ID required");
  }

  if (!currentUser) {
    throw new Error("Unauthorized");
  }

  // Prevent self deletion
  if (targetUserId === currentUser.uid) {
    throw new Error("You cannot delete yourself");
  }

  // Fetch current user profile
  const currentRef = doc(db, "users", currentUser.uid);
  const currentSnap = await getDoc(currentRef);

  if (!currentSnap.exists()) {
    throw new Error("Unauthorized");
  }

  const currentData = currentSnap.data();

  // Fetch target user profile
  const targetRef = doc(db, "users", targetUserId);
  const targetSnap = await getDoc(targetRef);

  if (!targetSnap.exists()) {
    throw new Error("User not found");
  }

  const targetData = targetSnap.data();

  // Already deleted
  if (targetData.status !== "Active") {
    throw new Error("User not found");
  }

  /* ===========================
     PERMISSION LOGIC
  ============================ */

  // SUPER ADMIN
  if (currentData.role === "super_admin") {
    if (targetData.role === "super_admin") {
      throw new Error("Cannot delete another Super Admin");
    }
  }

  // ADMIN
  else if (currentData.role === "admin") {
    if (targetData.role !== "employee") {
      throw new Error("Unauthorized");
    }

    if (currentData.organizationId !== targetData.organizationId) {
      throw new Error("Unauthorized");
    }
  }

  // EMPLOYEE
  else {
    throw new Error("Unauthorized");
  }

  /* ===========================
     SOFT DELETE
  ============================ */

  await updateDoc(targetRef, {
    status: "Deleted"
  });

  return true;
};