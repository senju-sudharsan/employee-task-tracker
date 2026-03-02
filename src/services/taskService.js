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

/* ============================================================
   INTERNAL HELPERS
============================================================ */

const toDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  return new Date(value);
};

const isOverdue = (task) => {
  if (!task.deadline || task.status === "Done") return false;
  const deadline = toDate(task.deadline);
  return deadline && deadline < new Date();
};

/* ============================================================
   CREATE TASK (SINGLE)
============================================================ */

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
    archived: false, // ✅ NEW
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

/* ============================================================
   CREATE TASK FOR ALL EMPLOYEES
============================================================ */

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
        archived: false, // ✅ NEW
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    )
  );
};

/* ============================================================
   UPDATE STATUS
============================================================ */

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
      const deadline = toDate(task.deadline);
      payload.completedLate = deadline < new Date();
    } else {
      payload.completedLate = false;
    }
  }

  await updateDoc(ref, payload);
};

/* ============================================================
   REOPEN TASK
============================================================ */

export const reopenTask = async (taskId) => {
  await updateDoc(doc(db, "tasks", taskId), {
    status: "To Do",
    completedAt: null,
    completedLate: false,
    updatedAt: serverTimestamp(),
  });
};

/* ============================================================
   ACKNOWLEDGE TASK
============================================================ */

export const acknowledgeTask = async (taskId) => {
  await updateDoc(doc(db, "tasks", taskId), {
    acknowledged: true,
    updatedAt: serverTimestamp(),
  });
};

/* ============================================================
   CLEANUP OLD COMPLETED TASKS (ARCHIVE INSTEAD OF DELETE)
============================================================ */

export const cleanupOldCompletedTasks = async () => {
  const snap = await getDocs(collection(db, "tasks"));

  const now = new Date();
  const sevenDaysAgo = new Date(
    now.getTime() - 7 * 24 * 60 * 60 * 1000
  );

  const updates = [];

  snap.docs.forEach((d) => {
    const task = d.data();

    if (
      task.status === "Done" &&
      task.completedAt &&
      typeof task.completedAt.toDate === "function" &&
      task.archived !== true
    ) {
      const completedDate = task.completedAt.toDate();

      if (completedDate < sevenDaysAgo) {
        updates.push(
          updateDoc(doc(db, "tasks", d.id), {
            archived: true,
            updatedAt: serverTimestamp(),
          })
        );
      }
    }
  });

  if (updates.length > 0) {
    await Promise.all(updates);
  }
};

/* ============================================================
   CENTRALIZED 7-DAY FILTER
============================================================ */

export const filterTasksLast7Days = (tasks = []) => {
  const now = new Date();
  const sevenDaysAgo = new Date(
    now.getTime() - 7 * 24 * 60 * 60 * 1000
  );

  return tasks.filter((task) => {
    if (task.archived === true) return false;

    const createdAt = toDate(task.createdAt);
    const completedAt = toDate(task.completedAt);

    const createdInWindow =
      createdAt && createdAt >= sevenDaysAgo;

    const completedInWindow =
      completedAt && completedAt >= sevenDaysAgo;

    return createdInWindow || completedInWindow;
  });
};

/* ============================================================
   CENTRALIZED METRICS CALCULATION
============================================================ */

export const computeTaskMetrics = (tasks = []) => {
  const total = tasks.length;

  const completed = tasks.filter(
    (t) => t.status === "Done"
  ).length;

  const completedLate = tasks.filter(
    (t) => t.status === "Done" && t.completedLate === true
  ).length;

  const inProgress = tasks.filter(
    (t) => t.status !== "Done"
  ).length;

  const overdue = tasks.filter(isOverdue).length;

  const completionRate =
    total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    completedLate,
    inProgress,
    overdue,
    completionRate,
  };
};

/* ============================================================
   FETCH TASKS (BACKWARD COMPATIBLE)
============================================================ */

export const getTasksByOrganization = async (organizationId) => {
  if (!organizationId) return [];

  const q = query(
    collection(db, "tasks"),
    where("organizationId", "==", organizationId)
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
};

export const getTasksByEmployee = async (uid) => {
  if (!uid) return [];

  const q = query(
    collection(db, "tasks"),
    where("assignedTo", "==", uid)
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
};

/* ============================================================
   REALTIME LISTENERS
============================================================ */

export const listenToTasksByEmployee = (uid, callback) => {
  if (!uid) return () => {};

  const q = query(
    collection(db, "tasks"),
    where("assignedTo", "==", uid)
  );

  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }))
    );
  });
};

export const listenToTasksByOrganization = (
  organizationId,
  callback
) => {
  if (!organizationId) return () => {};

  const q = query(
    collection(db, "tasks"),
    where("organizationId", "==", organizationId)
  );

  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }))
    );
  });
};

/* ============================================================
   EMPLOYEES
============================================================ */

export const getEmployeesByOrganization = async (
  organizationId
) => {
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