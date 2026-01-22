import { useState } from "react";
import { createTask } from "../services/taskService";

function CreateTaskForm({ organizationId, onCreated }) {
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState("");

  const handleCreate = async () => {
    if (!title || !assignedTo) return;

    await createTask({
      title,
      organizationId,
      assignedTo
    });

    setTitle("");
    setAssignedTo("");
    onCreated();
  };

  return (
    <div style={{ marginBottom: 32 }}>
      <h3>Create Task</h3>

      <input
        placeholder="Task title"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />

      <input
        placeholder="Assign to (employee UID)"
        value={assignedTo}
        onChange={e => setAssignedTo(e.target.value)}
      />

      <button onClick={handleCreate}>Create Task</button>
    </div>
  );
}

export default CreateTaskForm;
