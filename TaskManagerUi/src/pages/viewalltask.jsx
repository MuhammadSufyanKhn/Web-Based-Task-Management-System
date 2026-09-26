import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const PRIORITY_BADGE = {
    High:    'badge-priority-high',
    Highest: 'badge-priority-highest',
    Medium:  'badge-priority-medium',
    Low:     'badge-priority-low',
    Lowest:  'badge-priority-lowest',
};

const ViewAllTasks = () => {
    const navigate = useNavigate();
    const { userId } = useParams();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterPriority, setFilterPriority] = useState('All');
    const [search, setSearch] = useState('');

    const token = localStorage.getItem('token');
    const decoded = token ? JSON.parse(atob(token.split('.')[1])) : null;
    const role = decoded ? decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] : null;
    const isAdminView = role === 'Admin' && !!userId;

    useEffect(() => {
        if (!token) { navigate('/login'); return; }
        const fetchTasks = async () => {
            try {
                const url = isAdminView
                    ? `https://localhost:7127/api/Task/user-tasks/${userId}`
                    : 'https://localhost:7127/api/Task/my-tasks';
                const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
                if (!res.ok) throw new Error('Failed to fetch tasks');
                setTasks(await res.json());
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const handleDelete = async (taskId) => {
        if (!window.confirm('Delete this task?')) return;
        try {
            await axios.delete(`https://localhost:7127/api/Task/delete-task/${taskId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks(prev => prev.filter(t => t.taskId !== taskId));
        } catch {
            alert('Failed to delete task.');
        }
    };

    const filtered = tasks.filter(t => {
        const matchPrio = filterPriority === 'All' || t.taskPriority === filterPriority;
        const q = search.toLowerCase();
        const matchSearch = !q || t.title?.toLowerCase().includes(q);
        return matchPrio && matchSearch;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Top bar */}
            <div className="page-topbar">
                <div>
                    <div className="page-title">{isAdminView ? 'User Tasks' : 'My Tasks'}</div>
                    <div className="page-subtitle">{tasks.length} total tasks</div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Back</button>
            </div>

            {/* Filters */}
            <div className="toolbar">
                <div className="search-input-wrap" style={{ width: 240 }}>
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        className="input"
                        placeholder="Search tasks..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <select
                    className="select"
                    style={{ width: 'auto' }}
                    value={filterPriority}
                    onChange={e => setFilterPriority(e.target.value)}
                >
                    <option value="All">All Priorities</option>
                    <option value="Highest">Highest</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                    <option value="Lowest">Lowest</option>
                </select>
                <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-base)', marginLeft: 'auto' }}>
                    {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Table */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                {loading ? (
                    <div className="empty-state"><div className="empty-icon">⏳</div><div className="empty-title">Loading…</div></div>
                ) : error ? (
                    <div className="empty-state"><div className="empty-icon">⚠️</div><div className="empty-title">{error}</div></div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Task</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Due Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                        No tasks match your filters.
                                    </td>
                                </tr>
                            ) : filtered.map(t => (
                                <tr key={t.taskId}>
                                    <td>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</div>
                                    </td>
                                    <td>
                                        <span className={`badge ${PRIORITY_BADGE[t.taskPriority] || 'badge-default'}`}>{t.taskPriority || '—'}</span>
                                    </td>
                                    <td>
                                        <span className="badge badge-default">{t.taskStatus || '—'}</span>
                                    </td>
                                    <td style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                                        {t.dueDate ? new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => navigate(`/ViewTaskDetails/${t.taskId}`)}
                                            >View</button>
                                            {(role === 'Admin') && (
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleDelete(t.taskId)}
                                                >Delete</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ViewAllTasks;
