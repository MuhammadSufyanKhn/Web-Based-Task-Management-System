import React, { useEffect, useState } from 'react';
import axios from 'axios';
import TaskList from './Tasklist';
import { useNavigate } from 'react-router-dom';
import StatsCard from '../components/StatsCard';

const Dashboard = () => {
    const [stats, setStats] = useState({ pendingCount: 0, inProgressCount: 0, completedCount: 0 });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) { navigate('/login'); return; }
                const res = await axios.get('https://localhost:7127/api/task/dashboard-stats', {
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
                <h2>My Task Dashboard</h2>
                <button
                    className="btn-profile"
                    onClick={() => navigate('/profile')}
                    style={{
                        marginLeft: "auto",
                        backgroundColor: "#3498db",
                        color: "white",
                        border: "none",
                        padding: "8px 20px",
                        borderRadius: "6px",
                        fontSize: "14px",
                        fontWeight: "600",
                        cursor: "pointer"
                    }}
                >
                    View Profile
                </button>
            </header>

            <div className="stats-container">
                <StatsCard title="Pending" count={stats.pendingCount} className="pending" />
                <StatsCard title="In-Progress" count={stats.inProgressCount} className="progress" />
                <StatsCard title="Completed" count={stats.completedCount} className="completed" />
            </div>

            <TaskList />
        </div>
    );
};

export default Dashboard;