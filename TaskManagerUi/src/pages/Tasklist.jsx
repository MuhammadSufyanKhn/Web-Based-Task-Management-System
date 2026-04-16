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
                    {tasks.map(task => (
                        <tr key={task.taskId}> 
                            <td>
                                <strong>{task.title}</strong>
                                <p style={{ fontSize: '11px' }}>{task.descriptions}</p>
                            </td>
                            <td><span className={`priority-${task.taskPriority}`}> {task.taskPriority}</span></td>
                            <td>
                                {/* Status-Pending, Status-InProgress, Status-Completed classes trigger hongi */}
                                <span className={`badge status-${task.taskStatus}`}>
                                    {task.taskStatus}
                                </span>
                            </td>
                            <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</td>
                            <td>
                                <button className="btn-edit" >Edit</button>
                                <button className="btn-delete">Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TaskList;