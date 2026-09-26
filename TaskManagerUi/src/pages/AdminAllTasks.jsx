import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PRIORITY_BADGE = {
    High:    'badge-priority-high',
    Highest: 'badge-priority-highest',
    Medium:  'badge-priority-medium',
    Low:     'badge-priority-low',
    Lowest:  'badge-priority-lowest',
};

const AdminAllTasks = () => {
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterPriority, setFilterPriority] = useState('All');
    const [search, setSearch] = useState('');
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchAllTasks = async () => {
            try {
                if (!token) { navigate('/login'); return; }
                const res = await fetch('https://localhost:7127/api/task/AllTasks', {
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to fetch tasks');
                setTasks(await res.json());
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllTasks();
    }, [navigate, token]);

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
        const matchesPriority = filterPriority === 'All' || t.taskPriority === filterPriority;
        const q = search.toLowerCase();
        const matchesSearch = !q || t.title?.toLowerCase().includes(q) || t.userName?.toLowerCase().includes(q);
        return matchesPriority && matchesSearch;
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Top bar */}
            <div className="page-topbar">
                <div>
                    <div className="page-title">All Tasks</div>
                    <div className="page-subtitle">{tasks.length} total tasks in the system</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/kanban')}>+ New Issue</button>
            </div>

            {/* Filters toolbar */}
            <div className="toolbar">
                <div className="search-input-wrap" style={{ width: 240 }}>
                    <span className="search-icon">🔍</span>
                    <input
                        id="admin-tasks-search"
                        type="text"
                        className="input"
                        placeholder="Search tasks..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <select
                    id="priority-filter"
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
                    <div className="empty-state">
                        <div className="empty-icon">⏳</div>
                        <div className="empty-title">Loading tasks…</div>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Task</th>
                                <th>Assigned To</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Due Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                        No tasks match your filters.
                                    </td>
                                </tr>
                            ) : filtered.map(task => (
                                <tr key={task.taskId}>
                                    <td>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{task.title}</div>
                                        {task.issueKey && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{task.issueKey}</div>}
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{task.userName || '—'}</td>
                                    <td>
                                        <span className={`badge ${PRIORITY_BADGE[task.taskPriority] || 'badge-default'}`}>
                                            {task.taskPriority || '—'}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="badge badge-default">{task.taskStatus || '—'}</span>
                                    </td>
                                    <td style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                id={`edit-task-${task.taskId}`}
                                                onClick={() => navigate(`/Admin-edit-task/${task.taskId}`)}
                                            >Edit</button>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                id={`view-task-${task.taskId}`}
                                                onClick={() => navigate(`/ViewTaskDetails/${task.taskId}`)}
                                            >View</button>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                id={`delete-task-${task.taskId}`}
                                                onClick={() => handleDelete(task.taskId)}
                                            >Delete</button>
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

export default AdminAllTasks;
