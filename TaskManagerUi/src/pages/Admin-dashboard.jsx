import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../Api/Axios';

const StatCard = ({ label, value, sub, accent, icon }) => (
    <div className="metric-card" style={{ borderTop: `3px solid ${accent}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="metric-label">{label}</span>
            <span style={{ fontSize: 20, opacity: 0.6 }}>{icon}</span>
        </div>
        <div className="metric-value" style={{ color: accent }}>{value}</div>
        {sub && <div className="metric-sub">{sub}</div>}
    </div>
);

const AdminCard = ({ to, label, desc, icon, color }) => (
    <Link to={to} style={{
        display: 'flex', flexDirection: 'column', gap: 8,
        padding: '20px', background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)',
        borderRadius: 'var(--radius-lg)', textDecoration: 'none', color: 'var(--text-primary)',
        transition: 'var(--transition-fast)',
    }}
        onMouseOver={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.background = 'var(--bg-overlay)'; }}
        onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--bg-border)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
    >
        <span style={{ fontSize: 24 }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: 'var(--text-md)' }}>{label}</span>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>{desc}</span>
    </Link>
);

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        pendingTasks: 0, inProgressTasks: 0, completedTasks: 0,
        totalTasks: 0, totalUsers: 0
    });
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }
        const fetchStats = async () => {
            try {
                const res = await api.get('/task/AdminStats');
                setStats(res.data);
            } catch (err) {
                console.error('Admin stats error', err);
            }
        };
        fetchStats();
    }, [navigate]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Page Header */}
            <div className="page-topbar">
                <div>
                    <div className="page-title">Admin Dashboard</div>
                    <div className="page-subtitle">System overview and administrative controls</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Link to="/AllUsersList" className="btn btn-secondary btn-sm">Manage Users</Link>
                    <Link to="/project-settings" className="btn btn-primary btn-sm">Settings</Link>
                </div>
            </div>

            <div className="page-content" style={{ flex: 1, overflowY: 'auto' }}>
                {/* Role badge */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
                    <span className="badge badge-danger" style={{ fontSize: 11 }}>🛡 Admin Access</span>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>You have full system access</span>
                </div>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
                    <StatCard label="Total Tasks"  value={stats.totalTasks}     accent="var(--accent-muted)" icon="📋" />
                    <StatCard label="Total Users"  value={stats.totalUsers}     accent="var(--info-text)"    icon="👥" />
                    <StatCard label="Pending"       value={stats.pendingTasks}   accent="var(--warning-text)" icon="⏳" />
                    <StatCard label="In Progress"   value={stats.inProgressTasks}accent="var(--info-text)"    icon="⚡" />
                    <StatCard label="Completed"     value={stats.completedTasks} accent="var(--success-text)" icon="✅" />
                </div>

                {/* Admin Actions */}
                <div style={{ marginBottom: 12, fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Admin Actions
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                    <AdminCard to="/kanban"          label="Kanban Board"     desc="View and manage all project tasks"           icon="📋" color="var(--accent)" />
                    <AdminCard to="/backlog"          label="Backlog & Sprints"desc="Plan, prioritize and manage sprints"          icon="📦" color="var(--info)" />
                    <AdminCard to="/reports"          label="Reports"          desc="Analytics, burndown, and velocity"            icon="📊" color="var(--success)" />
                    <AdminCard to="/project-settings" label="Project Settings" desc="Configure statuses, labels, and Jira"         icon="⚙️" color="var(--warning)" />
                    <AdminCard to="/AdminAllTasks"    label="All Tasks"        desc="View and administer every task"              icon="🗂️" color="var(--accent-muted)" />
                    <AdminCard to="/AllUsersList"     label="User Management"  desc="View, edit, and manage team members"         icon="👥" color="var(--danger-text)" />
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
