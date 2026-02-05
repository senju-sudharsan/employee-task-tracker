import { db } from "../firebase"; // ✅ THIS LINE WAS MISSING
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";

/* ===========================
   GET ALL ORGANIZATIONS
=========================== */
export const getAllOrganizations = async () => {
  const snap = await getDocs(collection(db, "organizations"));
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data()
  }));
};

/* ===========================
   CREATE ORGANIZATION
=========================== */
export const createOrganization = async ({ name, createdBy }) => {
  await addDoc(collection(db, "organizations"), {
    name,
    status: "active",
    createdBy,
    createdAt: serverTimestamp()
  });
};

/* ===========================
   TOGGLE ORGANIZATION STATUS
=========================== */
export const toggleOrganizationStatus = async (orgId, currentStatus) => {
  const ref = doc(db, "organizations", orgId);
  await updateDoc(ref, {
    status: currentStatus === "active" ? "disabled" : "active"
  });
};

/* ===========================
   GET ORGANIZATION BY ID
=========================== */
export const getOrganizationById = async (orgId) => {
  const ref = doc(db, "organizations", orgId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...snap.data()
  };
};
