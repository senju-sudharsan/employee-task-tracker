import { useEffect, useState } from "react";
import { getAllTasks } from "../services/taskService";

function TasksPage() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    getAllTasks().then(data => setTasks(data || []));
  }, []);

  return (
    <>
      <h2>Tasks</h2>
      {tasks.length === 0 && <p>No tasks available.</p>}

      {tasks.map(t => (
        <div key={t.id}>{t.title}</div>
      ))}
    </>
  );
}

export default TasksPage;

