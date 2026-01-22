import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword
} from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

/* ===========================
   CREATE ADMIN (SUPER ADMIN)
=========================== */
export const createAdminUser = async ({
  email,
  password,
  name,
  organizationId,
  createdBy
}) => {
  const userCredential =
    await createUserWithEmailAndPassword(auth, email, password);

  const uid = userCredential.user.uid;

  await setDoc(doc(db, "users", uid), {
    uid,
    name,
    email,
    role: "admin",
    organizationId,
    createdBy,
    createdAt: serverTimestamp()
  });

  return uid;
};

/* ===========================
   CREATE EMPLOYEE (ADMIN / SUPER ADMIN)
=========================== */
export const createEmployeeUser = async ({
  email,
  password,
  name,
  organizationId,
  createdBy
}) => {
  const userCredential =
    await createUserWithEmailAndPassword(auth, email, password);

  const uid = userCredential.user.uid;

  await setDoc(doc(db, "users", uid), {
    uid,
    name,
    email,
    role: "employee",
    organizationId,
    createdBy,
    createdAt: serverTimestamp()
  });

  return uid;
};
