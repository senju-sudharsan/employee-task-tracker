import { useEffect, useState } from "react";
import { getTasksByEmployee } from "../services/taskService";
import { auth } from "../firebase";

function EmployeeDashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!auth.currentUser) return;
      const data = await getTasksByEmployee(auth.currentUser.uid);
      setTasks(data);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div>Loading tasks...</div>;

  return (
    <div>
      <h1>Employee Dashboard</h1>

      {tasks.length === 0 && <p>No tasks assigned</p>}

      {tasks.map(t => (
        <div key={t.id}>{t.title}</div>
      ))}
    </div>
  );
}

export default EmployeeDashboard;


