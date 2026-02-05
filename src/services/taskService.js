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
   CREATE TASK (ADMIN)
===================== */
export const createTask = async ({
  title,
  organizationId,
  assignedTo,
  description
}) => {
  await addDoc(collection(db, "tasks"), {
    title,
    description: description || "",
    organizationId,
    assignedTo,
    status: "To Do",
    acknowledged: false,
    delayed: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};


/* =====================
   UPDATE TASK (EMPLOYEE)
===================== */
export const updateTaskStatus = async (taskId, status) => {
  const ref = doc(db, "tasks", taskId);
  await updateDoc(ref, {
    status,
    updatedAt: serverTimestamp()
  });
};

export const acknowledgeTask = async (taskId) => {
  const ref = doc(db, "tasks", taskId);
  await updateDoc(ref, {
    acknowledged: true,
    updatedAt: serverTimestamp()
  });
};

export const markTaskDelayed = async (taskId) => {
  const ref = doc(db, "tasks", taskId);
  await updateDoc(ref, {
    delayed: true,
    updatedAt: serverTimestamp()
  });
};

/* =====================
   GET TASKS
===================== */
export const getAllTasks = async () => {
  const snap = await getDocs(collection(db, "tasks"));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getTasksByOrganization = async (organizationId) => {
  const q = query(
    collection(db, "tasks"),
    where("organizationId", "==", organizationId)
  );

  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getTasksByEmployee = async (uid) => {
  const q = query(
    collection(db, "tasks"),
    where("assignedTo", "==", uid)
  );

  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/* =====================
   GET EMPLOYEES (ADMIN)
===================== */
export const getEmployeesByOrganization = async (organizationId) => {
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





