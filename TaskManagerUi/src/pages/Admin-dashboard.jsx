import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TaskList from './Tasklist';
import Profile from './profile';
import { useNavigate } from 'react-router-dom';
import AdminAllTasks from './AdminAllTasks'
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const [stats, setStats] = useState({ pendingCount: 0, inProgressCount: 0, completedCount: 0 });
    const [role, setRole] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }
                const res = await axios.get('https://localhost:7127/api/task/AdminStats', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(res.data);

                const payload = JSON.parse(atob(token.split('.')[1]));
                setRole(payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]);
            } catch (err) {
                console.error("Stats cant be loaded", err);
            }
        };
        fetchStats();
    }, []);
    if (localStorage.getItem('token') === null) {
        navigate('/login');
    }

    return (
        <div className="dashboard-main">
            <header className="dash-header">
                <h2>{"Admin Dashboard"}</h2>

                <button style={{
                    padding: "12px 30px",
                    backgroundColor: "#e74c3c",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "600",
                    cursor: "pointer"
                }} onClick={() => {
                    localStorage.removeItem('token');
                    navigate('/login');
                }}>Logout </button>
            </header>

            <div className="welcome-message">
                <h2>System Overview</h2>
                <p>
                    Manage your administrative workflow and monitor
                    real-time user activity from a single interface.
                </p>
            </div>
            <div>
                    <h2 style={{ marginTop: '2px', color: '#1a3a5a' }}>Task Overview</h2>
            </div>
            <div className="stats-container">
                <div className="stat-card total">
                    <h3>Total Tasks</h3>
                    <p className="count">{stats.totalTasks || 0}</p>
                </div>

                <div className="stat-card users">
                    <h3>Total Users</h3>
                    <p className="count">{stats.totalUsers || 0}</p>
                </div>
            </div>

            <div>
                    <h2 style={{ marginTop: '5px', color: '#1a3a5a' }}>Task Status Breakdown</h2>
            </div>
            <div className="stats-container">
                <div className="stat-card pending">
                    <h3>Pending</h3>
                    <p className="count">{stats.pendingTasks || 0}</p>
                </div>

                <div className="stat-card progress">
                    <h3>In-Progress</h3>
                    <p className="count">{stats.inProgressTasks || 0}</p>
                </div>

                <div className="stat-card completed">
                    <h3>Completed</h3>
                    <p className="count">{stats.completedTasks || 0}</p>
                </div>
            </div>
            <div className="dashboard-actions">
                <Link to="/AdminAllTasks" className="action-link">View All Tasks</Link>
                <Link to="/admin/all-users" className="action-link">View All Users</Link>
            </div>
        </div>
    );
};

export default Dashboard;