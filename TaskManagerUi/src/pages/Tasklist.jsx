import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const TaskList = () => {
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        const fetchTasks = async () => {
            const token = localStorage.getItem('token');
            const res = await axios.get('https://localhost:7127/api/task/my-tasks', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks(res.data);
        };
        fetchTasks();
    }, []);

    return (
        <div className="task-table-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>📋 My Tasks</h2>
                <Link to="/create-task" className="add-btn" style={{ textDecoration: 'none' }}>+ New Task</Link>
            </div>

            <table className="task-table">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Due Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {tasks.slice(0, 2).map(task => (
                        <tr key={task.taskId}>
                            <td>
                                <strong>{task.title}</strong>
                            </td>
                            <td><span className={`priority-${task.taskPriority}`}> {task.taskPriority}</span></td>
                            <td>

                                <span className={`badge status-${task.taskStatus}`}>
                                    {task.taskStatus}
                                </span>
                            </td>
                            <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</td>
                            <td>
                                <Link style={{ textDecoration: 'none' }} to={`/edit-task/${task.taskId}`} className="btn-edit">Edit</Link>

                                <button
                                    className="btn-delete"
                                    onClick={async () => {
                                        if (window.confirm("Are you sure you want to delete this task?")) {
                                            try {
                                                await axios.delete(`https://localhost:7127/api/Task/delete-task/${task.taskId}`, {
                                                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
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
                                <Link style={{ textDecoration: 'none' }} to={`/ViewTaskDetails/${task.taskId}`} className="btn-view">View Details</Link>
                            </td>
                        </tr>
                    ))}
                </tbody>
                {
                    tasks.length > 2 && (
                        <tfoot>
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '15px 0', background: 'linear-gradient(to right, #fff, #fff9e6, #fff)', borderTop: '1px solid #eee',  }}>
                                    <Link style={{ textDecoration: 'none', color: '#b8860b', fontWeight: 'bold', display: 'block', textAlign: 'center' }} to="/view-all-tasks" className="view-all-link">View All Tasks ({tasks.length})</Link>
                                </td>
                            </tr>
                        </tfoot>
                    )
                }
            </table>
        </div>
    );
};

export default TaskList;