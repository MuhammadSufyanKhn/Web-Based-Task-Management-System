import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import StatsCard from '../components/StatsCard';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        pendingTasks: 0, inProgressTasks: 0, completedTasks: 0,
        totalTasks: 0, totalUsers: 0
    });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) { navigate('/login'); return; }
                const res = await axios.get('https://localhost:7127/api/task/AdminStats', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(res.data);
            } catch (err) {
                console.error("Stats cant be loaded", err);
            }
        };
        fetchStats();
    }, [navigate]);

    if (!localStorage.getItem('token')) navigate('/login');

    return (
        <div className="dashboard-main">
            <header className="dash-header">
                <h2>Admin Dashboard</h2>
                <button
                    onClick={() => { localStorage.removeItem('token'); navigate('/login'); }}
                    style={{
                        padding: "12px 30px",
                        backgroundColor: "#e74c3c",
                        color: "#fff",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "16px",
                        fontWeight: "600",
                        cursor: "pointer"
                    }}
                >
                    Logout
                </button>
            </header>

            <div className="welcome-message">
                <h2>System Overview</h2>
                <p>Manage your administrative workflow and monitor real-time user activity from a single interface.</p>
            </div>

            <h2 style={{ marginTop: '2px', color: '#1a3a5a' }}>Task Overview</h2>
            <div className="stats-container">
                <StatsCard title="Total Tasks" count={stats.totalTasks} className="total" />
                <StatsCard title="Total Users" count={stats.totalUsers} className="users" />
            </div>

            <h2 style={{ marginTop: '5px', color: '#1a3a5a' }}>Task Status Breakdown</h2>
            <div className="stats-container">
                <StatsCard title="Pending" count={stats.pendingTasks} className="pending" />
                <StatsCard title="In-Progress" count={stats.inProgressTasks} className="progress" />
                <StatsCard title="Completed" count={stats.completedTasks} className="completed" />
            </div>

            <div className="dashboard-actions">
                <Link to="/AdminAllTasks" className="action-link">View All Tasks</Link>
                <Link to="/AllUsersList" className="action-link">View All Users</Link>
            </div>
        </div>
    );
};

export default AdminDashboard;