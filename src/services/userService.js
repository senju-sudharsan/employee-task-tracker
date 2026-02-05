import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

/* ===========================
   GET ALL USERS
=========================== */
export const getAllUsers = async () => {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));
};

/* ===========================
   CREATE EMPLOYEE
   (ADMIN & SUPER ADMIN)
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

  // 1️⃣ Create Auth account
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;

  // 2️⃣ Create Firestore profile (UID === DOC ID)
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
   (SUPER ADMIN ONLY)
=========================== */
export const createAdmin = async ({
  name,
  email,
  password,
  organizationId,
  createdBy
}) => {
  if (!name || !email || !password || !organizationId) {
    throw new Error("All fields are required");
  }

  const cred = await createUserWithEmailAndPassword(auth, email, password);
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
