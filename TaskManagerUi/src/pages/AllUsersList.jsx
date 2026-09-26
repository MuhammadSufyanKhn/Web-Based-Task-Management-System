import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AllUsersList = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchAllUsers = async () => {
            try {
                if (!token) { navigate('/login'); return; }
                const res = await fetch('https://localhost:7127/api/Task/AllUsers', {
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to fetch users');
                const data = await res.json();
                setUsers(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllUsers();
    }, [navigate, token]);

    const handleEdit   = (id) => navigate(`/Admin-edit-user/${id}`);
    const handleView   = (id) => navigate(`/view-all-tasks/${id}`);
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await axios.delete(`https://localhost:7127/api/user/Delete-user/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(prev => prev.filter(u => u.userId !== id));
        } catch {
            alert('Failed to delete user.');
        }
    };

    const filtered = users.filter(u => {
        const q = searchTerm.toLowerCase();
        return u.userName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Top bar */}
            <div className="page-topbar">
                <div>
                    <div className="page-title">User Management</div>
                    <div className="page-subtitle">{users.length} registered team members</div>
                </div>
            </div>

            {/* Search toolbar */}
            <div className="toolbar">
                <div className="search-input-wrap" style={{ width: 280 }}>
                    <span className="search-icon">🔍</span>
                    <input
                        id="user-search"
                        type="text"
                        className="input"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-base)', marginLeft: 'auto' }}>
                    {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Table */}
            <div className="page-content" style={{ flex: 1, overflowY: 'auto', padding: 0 }}>
                {loading ? (
                    <div className="empty-state">
                        <div className="empty-icon">⏳</div>
                        <div className="empty-title">Loading users…</div>
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Tasks</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                                        No users match your search.
                                    </td>
                                </tr>
                            ) : filtered.map(u => {
                                const initials = u.userName
                                    ? u.userName.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
                                    : 'U';
                                return (
                                    <tr key={u.userId}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div className="avatar avatar-md">{initials}</div>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.userName}</div>
                                                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>ID #{u.userId}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                                        <td>
                                            <span className="badge badge-default">{u.totalTasks || 0} tasks</span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button
                                                    className="btn btn-secondary btn-sm"
                                                    id={`edit-user-${u.userId}`}
                                                    onClick={() => handleEdit(u.userId)}
                                                >Edit</button>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    id={`view-user-${u.userId}`}
                                                    onClick={() => handleView(u.userId)}
                                                >Tasks</button>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    id={`delete-user-${u.userId}`}
                                                    onClick={() => handleDelete(u.userId)}
                                                >Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AllUsersList;
