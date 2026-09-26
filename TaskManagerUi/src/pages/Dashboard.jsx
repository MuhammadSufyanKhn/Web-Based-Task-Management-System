import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
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

const QuickLink = ({ to, label, icon, color }) => (
    <Link
        to={to}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--bg-border)',
            borderRadius: 'var(--radius-lg)',
            textDecoration: 'none',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-base)',
            fontWeight: 600,
            transition: 'var(--transition-fast)',
        }}
        onMouseOver={e => {
            e.currentTarget.style.background = 'var(--bg-overlay)';
            e.currentTarget.style.borderColor = color;
        }}
        onMouseOut={e => {
            e.currentTarget.style.background = 'var(--bg-elevated)';
            e.currentTarget.style.borderColor = 'var(--bg-border)';
        }}
    >
        <span style={{
            width: 32, height: 32, borderRadius: 'var(--radius-md)',
            background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, color, flexShrink: 0
        }}>{icon}</span>
        <span>{label}</span>
        <span style={{ marginLeft: 'auto', color: 'var(--text-tertiary)', fontSize: 12 }}>→</span>
    </Link>
);

const Dashboard = () => {
    const [stats, setStats] = useState({ pendingCount: 0, inProgressCount: 0, completedCount: 0 });
    const [recentTasks, setRecentTasks] = useState([]);
    const navigate = useNavigate();

    // Get user info
    const token = localStorage.getItem('token');
    let userName = 'Team Member';
    if (token) {
        try {
            const d = jwtDecode(token);
            userName = d['http://schemas.microsoft.com/ws/2008/06/identity/claims/name'] || 'Team Member';
        } catch { /* ignore */ }
    }

    useEffect(() => {
        if (!token) { navigate('/login'); return; }
        const fetchStats = async () => {
            try {
                const res = await api.get('/task/dashboard-stats');
                setStats(res.data);
            } catch (err) {
                console.error('Stats error', err);
            }
        };
        const fetchRecent = async () => {
            try {
                const res = await api.get('/task/my-tasks');
                setRecentTasks((res.data || []).slice(0, 5));
            } catch { /* ignore */ }
        };
        fetchStats();
        fetchRecent();
    }, [navigate, token]);

    const total = stats.pendingCount + stats.inProgressCount + stats.completedCount;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Page Header */}
            <div className="page-topbar">
                <div>
                    <div className="page-title">Dashboard</div>
                    <div className="page-subtitle">Welcome back, {userName.split(' ')[0]} 👋</div>
                </div>
                <button className="btn btn-primary" id="new-task-btn" onClick={() => navigate('/kanban')}>
                    + Create Issue
                </button>
            </div>

            {/* Main Content */}
            <div className="page-content" style={{ flex: 1, overflowY: 'auto' }}>
                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                    <StatCard label="Total Tasks"   value={total}                   accent="var(--accent-muted)"    icon="📋" />
                    <StatCard label="Pending"        value={stats.pendingCount}      accent="var(--warning-text)"    icon="⏳" sub="Awaiting start" />
                    <StatCard label="In Progress"    value={stats.inProgressCount}   accent="var(--info-text)"       icon="⚡" sub="Actively worked" />
                    <StatCard label="Completed"      value={stats.completedCount}    accent="var(--success-text)"    icon="✅" sub="Done" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
                    {/* Recent Tasks */}
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">My Recent Tasks</span>
                            <Link to="/view-all-tasks" className="btn btn-ghost btn-sm">View all →</Link>
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            {recentTasks.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">📭</div>
                                    <div className="empty-title">No tasks yet</div>
                                    <div className="empty-desc">Create your first task from the Kanban board.</div>
                                    <button className="btn btn-primary" onClick={() => navigate('/kanban')}>Go to Board</button>
                                </div>
                            ) : (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Task</th>
                                            <th>Status</th>
                                            <th>Priority</th>
                                            <th>Due</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentTasks.map(task => {
                                            const statusMap = {
                                                Pending: 'badge-warning',
                                                InProgress: 'badge-accent',
                                                Completed: 'badge-success',
                                            };
                                            const prioMap = {
                                                High: 'badge-danger',
                                                Highest: 'badge-danger',
                                                Medium: 'badge-warning',
                                                Low: 'badge-success',
                                                Lowest: 'badge-default',
                                            };
                                            return (
                                                <tr key={task.taskId}
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => navigate('/kanban')}>
                                                    <td>
                                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{task.title}</div>
                                                        {task.issueKey && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{task.issueKey}</div>}
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${statusMap[task.status] || 'badge-default'}`}>
                                                            {task.status || '—'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${prioMap[task.priority] || 'badge-default'}`}>
                                                            {task.priority || '—'}
                                                        </span>
                                                    </td>
                                                    <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                                                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                            Quick Access
                        </div>
                        <QuickLink to="/kanban"   label="Kanban Board"  icon="📋" color="var(--accent)" />
                        <QuickLink to="/backlog"  label="Backlog"        icon="📦" color="var(--info)" />
                        <QuickLink to="/reports"  label="Reports"        icon="📊" color="var(--success)" />
                        <QuickLink to="/calendar" label="Calendar"       icon="📅" color="var(--warning)" />
                        <QuickLink to="/profile"  label="My Profile"     icon="👤" color="var(--accent-muted)" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
