import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../Api/Axios';

const Profile = () => {
    const [user, setUser] = useState({ userName: '', email: '', password: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const navigate = useNavigate();

    // Get role from token
    const token = localStorage.getItem('token');
    let userRole = 'User';
    let userInitials = 'U';
    if (token) {
        try {
            const d = jwtDecode(token);
            userRole = d['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 'User';
        } catch { /* ignore */ }
    }

    useEffect(() => {
        if (!token) { navigate('/login'); return; }
        api.get('/user/Profile')
            .then(res => {
                const name = res.data.userName || '';
                setUser({ userName: name, email: res.data.email || '', password: '' });
                userInitials = name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'U';
            })
            .catch(err => console.error('Error fetching profile', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const initials = user.userName
        ? user.userName.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
        : userRole[0];

    const handleUpdate = async () => {
        setSaving(true);
        setErrorMsg('');
        setSuccessMsg('');
        try {
            await api.put('/user/Update-profile', user);
            setIsEditing(false);
            setSuccessMsg('Profile updated successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch {
            setErrorMsg('Failed to update profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setErrorMsg('');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Top bar */}
            <div className="page-topbar">
                <div>
                    <div className="page-title">My Profile</div>
                    <div className="page-subtitle">Manage your account information</div>
                </div>
                <span className={`badge ${userRole === 'Admin' ? 'badge-danger' : 'badge-accent'}`}>
                    {userRole === 'Admin' ? '🛡 Admin' : '👤 Team Member'}
                </span>
            </div>

            <div className="page-content" style={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                <div style={{ width: '100%', maxWidth: 520, paddingTop: 24 }}>
                    {/* Avatar Card */}
                    <div className="card" style={{ marginBottom: 20, padding: '28px 24px', textAlign: 'center' }}>
                        <div style={{
                            width: 80, height: 80, borderRadius: '50%',
                            background: userRole === 'Admin' ? 'var(--accent)' : '#0ea5e9',
                            color: '#fff', fontSize: 28, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px auto',
                            boxShadow: '0 4px 16px rgba(99,102,241,0.3)'
                        }}>
                            {initials}
                        </div>
                        <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                            {user.userName || '—'}
                        </div>
                        <div style={{ fontSize: 'var(--text-base)', color: 'var(--text-tertiary)' }}>{user.email}</div>
                    </div>

                    {/* Success / Error banners */}
                    {successMsg && (
                        <div className="alert alert-success" style={{ marginBottom: 16 }}>
                            <span>✓</span><span>{successMsg}</span>
                        </div>
                    )}
                    {errorMsg && (
                        <div className="alert alert-error" style={{ marginBottom: 16 }}>
                            <span>⚠</span><span>{errorMsg}</span>
                        </div>
                    )}

                    {/* Form Card */}
                    <div className="card">
                        <div className="card-header">
                            <span className="card-title">{isEditing ? 'Edit Profile' : 'Account Information'}</span>
                        </div>
                        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {/* Full Name */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="profile-name">Full Name</label>
                                {isEditing ? (
                                    <input
                                        id="profile-name"
                                        className="input"
                                        name="userName"
                                        value={user.userName}
                                        onChange={e => setUser({ ...user, userName: e.target.value })}
                                        autoFocus
                                    />
                                ) : (
                                    <div style={{
                                        padding: '9px 12px',
                                        background: 'var(--bg-elevated)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--text-primary)',
                                        fontSize: 'var(--text-md)',
                                        border: '1px solid var(--bg-border)'
                                    }}>
                                        {user.userName || '—'}
                                    </div>
                                )}
                            </div>

                            {/* Email */}
                            <div className="form-group">
                                <label className="form-label" htmlFor="profile-email">Email Address</label>
                                {isEditing ? (
                                    <input
                                        id="profile-email"
                                        className="input"
                                        name="email"
                                        type="email"
                                        value={user.email}
                                        onChange={e => setUser({ ...user, email: e.target.value })}
                                    />
                                ) : (
                                    <div style={{
                                        padding: '9px 12px',
                                        background: 'var(--bg-elevated)',
                                        borderRadius: 'var(--radius-md)',
                                        color: 'var(--text-secondary)',
                                        fontSize: 'var(--text-md)',
                                        border: '1px solid var(--bg-border)'
                                    }}>
                                        {user.email || '—'}
                                    </div>
                                )}
                            </div>

                            {/* Password (only when editing) */}
                            {isEditing && (
                                <div className="form-group">
                                    <label className="form-label" htmlFor="profile-password">New Password</label>
                                    <input
                                        id="profile-password"
                                        className="input"
                                        type="password"
                                        name="password"
                                        placeholder="Leave blank to keep current"
                                        value={user.password}
                                        onChange={e => setUser({ ...user, password: e.target.value })}
                                    />
                                    <span className="form-hint">Only fill in if you want to change your password.</span>
                                </div>
                            )}

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                                {isEditing ? (
                                    <>
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleUpdate}
                                            disabled={saving}
                                            id="save-profile-btn"
                                            style={{ flex: 1 }}
                                        >
                                            {saving ? 'Saving…' : '✓ Save Changes'}
                                        </button>
                                        <button
                                            className="btn btn-secondary"
                                            onClick={handleCancel}
                                            id="cancel-edit-btn"
                                        >
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setIsEditing(true)}
                                        id="edit-profile-btn"
                                        style={{ flex: 1 }}
                                    >
                                        ✏️ Edit Profile
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
