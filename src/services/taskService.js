import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";

/* =====================
   CREATE TASK (ADMIN / SUPER ADMIN)
   🔒 HARD LOCKED – DO NOT TOUCH
===================== */
export const createTask = async ({
  title,
  organizationId,
  assignedTo,
  description,
  deadline = null
}) => {
  // 🔒 ABSOLUTE SAFETY CHECKS
  if (!organizationId) {
    throw new Error("organizationId is required to create a task");
  }

  if (!title) {
    throw new Error("title is required to create a task");
  }

  if (!assignedTo) {
    throw new Error("assignedTo is required to create a task");
  }

  await addDoc(collection(db, "tasks"), {
    title,
    description: description || "",
    organizationId,
    assignedTo,

    status: "To Do",
    acknowledged: false,

    deadline,          // Date | Timestamp | null
    completedAt: null,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

/* =====================
   UPDATE TASK STATUS (EMPLOYEE)
===================== */
export const updateTaskStatus = async (taskId, status) => {
  const ref = doc(db, "tasks", taskId);

  const payload = {
    status,
    updatedAt: serverTimestamp()
  };

  if (status === "Done") {
    payload.completedAt = serverTimestamp();
  }

  await updateDoc(ref, payload);
};

/* =====================
   ACKNOWLEDGE TASK
===================== */
export const acknowledgeTask = async (taskId) => {
  const ref = doc(db, "tasks", taskId);
  await updateDoc(ref, {
    acknowledged: true,
    updatedAt: serverTimestamp()
  });
};

/* =====================
   GET TASKS
===================== */
export const getAllTasks = async () => {
  const snap = await getDocs(collection(db, "tasks"));
  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const getTasksByOrganization = async (organizationId) => {
  if (!organizationId) return [];

  const q = query(
    collection(db, "tasks"),
    where("organizationId", "==", organizationId)
  );

  const snap = await getDocs(q);
  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

export const getTasksByEmployee = async (uid) => {
  if (!uid) return [];

  const q = query(
    collection(db, "tasks"),
    where("assignedTo", "==", uid)
  );

  const snap = await getDocs(q);
  return snap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

/* =====================
   GET EMPLOYEES (ADMIN / SUPER ADMIN)
===================== */
export const getEmployeesByOrganization = async (organizationId) => {
  if (!organizationId) return [];

  const q = query(
    collection(db, "users"),
    where("organizationId", "==", organizationId),
    where("role", "==", "employee")
  );

  const snap = await getDocs(q);
  return snap.docs.map(doc => ({
    uid: doc.id,
    ...doc.data()
  }));
};
