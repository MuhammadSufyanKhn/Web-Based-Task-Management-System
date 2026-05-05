import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TaskList from './Tasklist';

const Dashboard = () => {
    const [stats, setStats] = useState({ pendingCount: 0, inProgressCount: 0, completedCount: 0 });
    const [role, setRole] = useState("");

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('https://localhost:7127/api/task/dashboard-stats', {
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

    return (
        <div className="dashboard-main">
            <header className="dash-header">
                <h2>{role === "Admin" ? "Admin Overview" : "My Task Dashboard"}</h2>
                <button className="btn-logout" onClick={() => { localStorage.clear(); window.location.href = "/login" }}>Logout</button>
            </header>

            <div className="stats-container">
                <div className="stat-card pending">
                    <h3>Pending</h3>
                    <p className="count">{stats.pendingCount}</p>
                </div>

                <div className="stat-card progress">
                    <h3>In-Progress</h3>
                    <p className="count">{stats.inProgressCount}</p>
                </div>

                <div className="stat-card completed">
                    <h3>Completed</h3>
                    <p className="count">{stats.completedCount}</p>
                </div>
            </div>
            <TaskList />
        </div>
    );
};

export default Dashboard;