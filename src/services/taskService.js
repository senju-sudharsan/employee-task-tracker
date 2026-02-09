import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";

/* =====================
   CREATE TASK (SINGLE)
===================== */
export const createTask = async ({
  title,
  organizationId,
  assignedTo,
  description,
  deadline = null,
  priority = "medium",
}) => {
  if (!organizationId) throw new Error("organizationId is required");
  if (!title) throw new Error("title is required");
  if (!assignedTo) throw new Error("assignedTo is required");

  await addDoc(collection(db, "tasks"), {
    title,
    description: description || "",
    organizationId,
    assignedTo,
    status: "To Do",
    acknowledged: false,
    priority,
    deadline,
    completedAt: null,
    completedLate: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

/* =====================
   CREATE TASK FOR ALL
===================== */
export const createTaskForAllEmployees = async ({
  title,
  organizationId,
  description,
  deadline = null,
  priority = "medium",
}) => {
  const q = query(
    collection(db, "users"),
    where("organizationId", "==", organizationId),
    where("role", "==", "employee")
  );

  const snap = await getDocs(q);
  if (snap.empty) throw new Error("This organization has no employees");

  await Promise.all(
    snap.docs.map((u) =>
      addDoc(collection(db, "tasks"), {
        title,
        description: description || "",
        organizationId,
        assignedTo: u.id,
        status: "To Do",
        acknowledged: false,
        priority,
        deadline,
        completedAt: null,
        completedLate: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    )
  );
};

/* =====================
   UPDATE STATUS
===================== */
export const updateTaskStatus = async (taskId, status) => {
  const ref = doc(db, "tasks", taskId);

  const payload = {
    status,
    updatedAt: serverTimestamp(),
  };

  if (status === "Done") {
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("Task not found");

    const task = snap.data();
    payload.completedAt = serverTimestamp();

    if (task.deadline) {
      const deadline =
        typeof task.deadline.toDate === "function"
          ? task.deadline.toDate()
          : new Date(task.deadline);

      payload.completedLate = deadline < new Date();
    } else {
      payload.completedLate = false;
    }
  }

  await updateDoc(ref, payload);
};

/* =====================
   REOPEN TASK
===================== */
export const reopenTask = async (taskId) => {
  await updateDoc(doc(db, "tasks", taskId), {
    status: "To Do",
    completedAt: null,
    completedLate: false,
    updatedAt: serverTimestamp(),
  });
};

/* =====================
   ACKNOWLEDGE
===================== */
export const acknowledgeTask = async (taskId) => {
  await updateDoc(doc(db, "tasks", taskId), {
    acknowledged: true,
    updatedAt: serverTimestamp(),
  });
};

/* =====================
   FETCH TASKS
===================== */
export const getTasksByOrganization = async (organizationId) => {
  if (!organizationId) return [];

  const q = query(
    collection(db, "tasks"),
    where("organizationId", "==", organizationId)
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getTasksByEmployee = async (uid) => {
  if (!uid) return [];

  const q = query(
    collection(db, "tasks"),
    where("assignedTo", "==", uid)
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/* =====================
   REALTIME LISTENER
===================== */
export const listenToTasksByEmployee = (uid, callback) => {
  if (!uid) return () => {};

  const q = query(
    collection(db, "tasks"),
    where("assignedTo", "==", uid)
  );

  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    );
  });
};

/* =====================
   EMPLOYEES
===================== */
export const getEmployeesByOrganization = async (organizationId) => {
  if (!organizationId) return [];

  const q = query(
    collection(db, "users"),
    where("organizationId", "==", organizationId),
    where("role", "==", "employee")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    uid: d.id,
    ...d.data(),
  }));
};
