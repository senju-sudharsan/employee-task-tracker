/**
 * Task time utilities
 * Single source of truth for deadline logic
 */

/**
 * Returns true if task is overdue
 * Rules:
 * - Must have a deadline
 * - Must NOT be completed
 * - Current time > deadline
 */
export function isTaskOverdue(task) {
  if (!task) return false;

  // Completed tasks are never overdue
  if (task.status === "Done") return false;

  // No deadline → not overdue
  if (!task.deadline) return false;

  let deadline;

  // Firestore Timestamp support
  if (typeof task.deadline.toDate === "function") {
    deadline = task.deadline.toDate();
  } else {
    deadline = new Date(task.deadline);
  }

  return new Date() > deadline;
}
