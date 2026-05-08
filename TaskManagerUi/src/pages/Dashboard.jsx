import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TaskList from './Tasklist';
import Profile from './profile';
import { useNavigate } from 'react-router-dom';

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
    if (localStorage.getItem('token') === null) {
        navigate('/login');
    }

    return (
        <div className="dashboard-main">
            <header className="dash-header">
                <h2>{role === "Admin" ? "Admin Overview" : "My Task Dashboard"}</h2>
                <button
                    style={{
                        marginLeft: "auto",
                        backgroundColor: "#3498db",
                        color: "white",
                        border: "none",
                        padding: "8px 20px",
                        borderRadius: "6px",
                        fontSize: "14px",
                        fontWeight: "600",
                        cursor: "pointer",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        outline: "none"
                    }}
                    className="btn-profile"
                    onClick={() => navigate('/profile')}
                >
                    View Profile
                </button>
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