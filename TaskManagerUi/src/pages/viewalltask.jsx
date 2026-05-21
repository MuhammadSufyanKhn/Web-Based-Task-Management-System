import React from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";

const ViewAllTasks = () => {
    const navigate = useNavigate();
    const { userId } = useParams();
    const [tasks, setTasks] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [filterPriority, setFilterPriority] = React.useState("All"); 
    const token = localStorage.getItem('token');

    const fetchAllTasks = async () => {
        try {
            if (!token) {
                navigate('/login');
                return;
            }
            const url = userId 
                ? `https://localhost:7127/api/Task/user-tasks/${userId}`
                : `https://localhost:7127/api/Task/my-tasks`;

            const res = await fetch(url, {
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

    const handleDeleteTask = async (taskId) => {
        if (window.confirm("Are you sure you want to delete this task?")) {
            try {
                await axios.delete(`https://localhost:7127/api/Task/delete-task/${taskId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTasks(tasks.filter(t => t.taskId !== taskId));
            } catch (error) {
                console.error("Error deleting task:", error);
            }
        }
    };

    React.useEffect(() => {
        fetchAllTasks();
    }, [userId]);

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
                <div>
                    <h2 style={{ margin: 0 }}>📋 All My Tasks</h2>
                    <p style={{ marginLeft: '5px', color: '#666', fontSize: '14px' }}>View and manage your assigned tasks.</p>
                </div>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <label style={{ fontWeight: 'bold', fontSize: '14px' }}>Filter Priority:</label>
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

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f8f9fa', textAlign: 'left' }}>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Title</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Priority</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Status</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Due Date</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid #eee' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredTasks.length > 0 ? (
                        filteredTasks.map(task => (
                            <tr key={task.taskId} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '12px' }}><strong>{task.title}</strong></td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{ fontWeight: '500' }}>{task.taskPriority}</span>
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        backgroundColor: '#e9ecef'
                                    }}>
                                        {task.taskStatus}
                                    </span>
                                </td>
                                <td style={{ padding: '12px' }}>
                                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                                </td>
                                <td style={{ padding: '12px', display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => navigate(`/edit-task/${task.taskId}`)}
                                        style={{
                                            backgroundColor: '#ffc107',
                                            border: 'none',
                                            padding: '6px 12px',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTask(task.taskId)}
                                        style={{
                                            backgroundColor: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            padding: '6px 12px',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        Delete
                                    </button>
                                    <button
                                        onClick={() => navigate(`/ViewTaskDetails/${task.taskId}`)}
                                        style={{
                                            backgroundColor: '#17a2b8',
                                            color: 'white',
                                            border: 'none',
                                            padding: '6px 12px',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        Details
                                    </button>
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

            <div style={{ marginTop: '30px', textAlign: 'center' }}>
    <button 
        onClick={() => navigate(-1)} 
        style={{
            color: '#1a1a40',
            textDecoration: 'none',
            fontSize: '14px',
            padding: '8px 16px',
            borderRadius: '6px',
            border: '2px solid #1a1a40',
            fontWeight: 'bold',
            backgroundColor: 'transparent',
            cursor: 'pointer'
        }}
    >
        ← Back 
    </button>
</div>

        </div>
    );
};

export default ViewAllTasks;