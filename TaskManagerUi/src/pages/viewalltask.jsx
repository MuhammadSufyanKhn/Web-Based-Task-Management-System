import React from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const ViewAllTasks = () => {
    const [tasks, setTasks] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [filterPriority, setFilterPriority] = React.useState("All"); 
    const token = localStorage.getItem('token');

    const fetchAllTasks = async () => {
        try {
            const res = await fetch(`https://localhost:7127/api/task/my-tasks`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch tasks");
            const data = await res.json();
            setTasks(data);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchAllTasks();
    }, []);

    const filteredTasks = tasks.filter(task => {
        if (filterPriority === "All") return true;
        return task.taskPriority === filterPriority;
    });

    if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;

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
                <h2 style={{ margin: 0 }}>📋 All My Tasks</h2>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>

                    <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Filter by Priority:</label>
                    <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ccc' }}
                    >
                        <option value="All">All Priorities</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>

                    <Link to="/create-task" className="add-btn" style={{
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

            <table className="task-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f8f9fa', textAlign: 'left' }}>
                        <th style={{ padding: '12px' }}>Title</th>
                        <th style={{ padding: '12px' }}>Priority</th>
                        <th style={{ padding: '12px' }}>Status</th>
                        <th style={{ padding: '12px' }}>Due Date</th>
                        <th style={{ padding: '12px' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredTasks.length > 0 ? (
                        filteredTasks.map(task => (
                            <tr key={task.taskId} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '12px' }}><strong>{task.title}</strong></td>
                                <td style={{ padding: '12px' }}>
                                    <span className={`priority-${task.taskPriority}`} style={{ fontWeight: '500' }}>
                                        {task.taskPriority}
                                    </span>
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <span className={`badge status-${task.taskStatus}`}>
                                        {task.taskStatus}
                                    </span>
                                </td>
                                <td style={{ padding: '12px' }}>
                                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                                </td>
                                <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                                    <Link to={`/edit-task/${task.taskId}`} className="btn-edit" style={{ textDecoration: 'none' }}>Edit</Link>

                                    <button
                                        className="btn-delete"
                                        onClick={async () => {
                                            if (window.confirm("Are you sure you want to delete this task?")) {
                                                try {
                                                    await axios.delete(`https://localhost:7127/api/Task/delete-task/${task.taskId}`, {
                                                        headers: { Authorization: `Bearer ${token}` }
                                                    });
                                                    setTasks(tasks.filter(t => t.taskId !== task.taskId));
                                                } catch (error) {
                                                    console.error("Error deleting task:", error);
                                                }
                                            }
                                        }}
                                    >
                                        Delete
                                    </button>

                                    <Link to={`/ViewTaskDetails/${task.taskId}`} className="btn-view" style={{ textDecoration: 'none' }}>Details</Link>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                                No tasks found matching this filter.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <Link to="/dashboard" style={{ color: '#ff00fbff', textDecoration: 'none', fontSize: '14px', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ff00fbff' }}>
                    ← Back to Dashboard
                </Link>
            </div>
        </div>
    );
};

export default ViewAllTasks;