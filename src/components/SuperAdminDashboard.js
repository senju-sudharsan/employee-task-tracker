import { useEffect, useState } from "react";
import { getAllTasks } from "../services/taskService";

function SuperAdminDashboard() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    getAllTasks().then(setTasks);
  }, []);

  return (
    <>
      <h2>Super Admin Dashboard</h2>
      <p>Total Tasks: {tasks.length}</p>
    </>
  );
}

export default SuperAdminDashboard;
