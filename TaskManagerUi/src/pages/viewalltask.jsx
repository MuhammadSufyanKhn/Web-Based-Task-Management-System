import React from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import TaskTable from "../components/TaskTable";

const ViewAllTasks = () => {
    const navigate = useNavigate();
    const { userId } = useParams();
    const [tasks, setTasks] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [filterPriority, setFilterPriority] = React.useState("All");

    const token = localStorage.getItem('token');
    const decoded = token ? JSON.parse(atob(token.split('.')[1])) : null;
    const role = decoded ? decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] : null;

    const fetchAllTasks = async () => {
        try {
            const url = role === "Admin" && userId
                ? `https://localhost:7127/api/Task/user-tasks/${userId}`
                : `https://localhost:7127/api/Task/my-tasks`;

            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error("Failed to fetch tasks");
            const data = await res.json();
            setTasks(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTask = async (taskId) => {
        if (window.confirm("Are you sure you want to delete this task?")) {
            try {
                await axios.delete(`https://localhost:7127/api/Task/delete-task/${taskId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTasks(tasks.filter(t => t.taskId !== taskId));
            } catch (err) {
                console.error("Error deleting task:", err);
            }
        }
    };

    React.useEffect(() => {
        if (!token) {
            navigate('/login');
            return;
        }
        fetchAllTasks();
    }, [userId]);

    const filteredTasks = tasks.filter(task =>
        filterPriority === "All" ? true : task.taskPriority === filterPriority
    );

    if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
    if (error) return <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>{error}</div>;

    return (
        <div style={{
            maxWidth: '1100px',
            margin: '40px auto',
            padding: '20px',
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h2 style={{ margin: 0 }}>📋 All My Tasks</h2>
                    <p style={{ marginLeft: '5px', color: '#666', fontSize: '14px' }}>View and manage your assigned tasks.</p>
                </div>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <label htmlFor="filterPriority" style={{ fontWeight: 'bold', fontSize: '14px' }}>Filter Priority:</label>
                    <select
                        id="filterPriority"
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
                    >
                        <option value="All">All Priorities</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                    <Link to="/create-task" style={{
                        textDecoration: 'none',
                        backgroundColor: '#007bff',
                        color: 'white',
                        padding: '10px 15px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: 'bold'
                    }}>+ New Task</Link>
                </div>
            </div>

            <TaskTable
                tasks={filteredTasks}
                onDelete={handleDeleteTask}
                emptyMessage="No tasks found matching this filter."
            />

            <div style={{ marginTop: '30px', textAlign: 'center' }}>
                <button onClick={() => navigate(-1)} style={{
                    color: '#1a1a40',
                    fontSize: '14px',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '2px solid #1a1a40',
                    fontWeight: 'bold',
                    backgroundColor: 'transparent',
                    cursor: 'pointer'
                }}>← Back</button>
            </div>
        </div>
    );
};

export default ViewAllTasks;