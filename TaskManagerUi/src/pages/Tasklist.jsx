import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const TaskList = () => {
    const [tasks, setTasks] = useState([]);
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await axios.get('https://localhost:7127/api/task/my-tasks', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTasks(res.data);
            } catch (error) {
                console.error("Error fetching tasks:", error);
            }
        };
        fetchTasks();
    }, [token]);

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

    return (
        <div style={{
            maxWidth: '1100px',
            margin: '20px auto',
            padding: '20px',
            backgroundColor: '#fff',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            width: '100%',
            boxSizing: 'border-box'
        }}>
            {/* Header Section - Exactly like Admin side */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h2 style={{ margin: 0 }}>📋 My Recent Tasks</h2>
                    <p style={{ marginLeft: '5px', color: '#666', fontSize: '14px' }}>Overview of your most recent activities.</p>
                </div>

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

            {/* Table Section - Exactly like Admin side */}
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
                    {tasks.length > 0 ? (
                        tasks.slice(0, 2).map(task => (
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
                                No recent tasks found.
                            </td>
                        </tr>
                    )}
                </tbody>
                {tasks.length > 2 && (
                    <tfoot>
                        <tr>
                            <td colSpan="5" style={{ padding: '0' }}>
                                <Link 
                                    to="/view-all-tasks" 
                                    style={{ 
                                        textDecoration: 'none', 
                                        color: '#007bff', 
                                        fontWeight: 'bold', 
                                        display: 'block', 
                                        textAlign: 'center',
                                        padding: '15px',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '0 0 12px 12px',
                                        fontSize: '14px',
                                        borderTop: '1px solid #eee'
                                    }}
                                >
                                    View All Tasks ({tasks.length}) →
                                </Link>
                            </td>
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
    );
};

export default TaskList;