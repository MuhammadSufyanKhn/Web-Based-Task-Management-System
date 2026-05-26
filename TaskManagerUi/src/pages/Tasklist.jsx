import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import TaskTable from "../components/TaskTable";

const TaskList = () => {
    const [tasks, setTasks] = useState([]);
    const token = localStorage.getItem('token');
    const decoded = jwtDecode(token);
    const userId = decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
    const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

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

            <TaskTable
                tasks={tasks.slice(0, 2)}
                onDelete={handleDeleteTask}
                emptyMessage="No recent tasks found."
            />

            {tasks.length > 2 && (
                <div style={{ borderTop: '1px solid #eee' }}>
                    <Link
                        to={role === "Admin" ? `/view-all-tasks/${userId}` : `/view-all-tasks`}
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
                        }}
                    >
                        View All Tasks ({tasks.length}) →
                    </Link>
                </div>
            )}
        </div>
    );
};

export default TaskList;