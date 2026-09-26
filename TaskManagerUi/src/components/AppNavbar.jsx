import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../Api/Axios';

const AppNavbar = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const token = localStorage.getItem('token');
    let userRole = 'User';
    let userName = 'User';

    if (token) {
        try {
            const decoded = jwtDecode(token);
            userRole = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || 'User';
            userName = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/name"] || 
                       (decoded.sub ? decoded.sub.split('@')[0] : (userRole === 'Admin' ? 'Administrator' : 'Team Member'));
        } catch {
            userRole = 'User';
            userName = 'User';
        }
    }

    const isAdmin = userRole === 'Admin';

    // Notifications state
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const notifRef = useRef(null);

    const fetchNotifications = async () => {
        if (!token) return;
        try {
            const res = await api.get('/notifications');
            if (res.data) {
                setNotifications(res.data.notifications || []);
                setUnreadCount(res.data.unreadCount || 0);
            }
        } catch {
            // Non-blocking
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Polling every 30s
        return () => clearInterval(interval);
    }, []);

    // Close notifications panel on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setIsNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error('Failed to mark all read', err);
        }
    };

    const handleNotificationClick = async (notif) => {
        if (!notif.isRead) {
            try {
                await api.put(`/notifications/${notif.id}/read`);
                setUnreadCount(prev => Math.max(0, prev - 1));
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
            } catch {
                // Ignore
            }
        }
        setIsNotifOpen(false);
        if (notif.taskId) {
            navigate('/kanban');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const dashboardPath = isAdmin ? '/Admin-dashboard' : '/dashboard';

    const navItems = [
        { path: dashboardPath, label: 'Dashboard', icon: '📊', adminOnly: false },
        { path: '/kanban', label: 'Board', icon: '📋', adminOnly: false },
        { path: '/list', label: 'List', icon: '📑', adminOnly: false },
        { path: '/calendar', label: 'Calendar', icon: '📅', adminOnly: false },
        { path: '/timeline', label: 'Timeline', icon: '⏱️', adminOnly: false },
        { path: '/gantt', label: 'Gantt', icon: '📊', adminOnly: false },
        { path: '/backlog', label: 'Backlog', icon: '📖', adminOnly: false },
        { path: '/reports', label: 'Reports', icon: '📈', adminOnly: false },
        { path: '/project-settings', label: 'Settings', icon: '⚙️', adminOnly: true },
        { path: '/AllUsersList', label: 'Users', icon: '👥', adminOnly: true }
    ];

    const isActive = (path) => {
        if (path === dashboardPath && (location.pathname === '/dashboard' || location.pathname === '/Admin-dashboard')) {
            return true;
        }
        return location.pathname === path;
    };

    return (
        <header style={{
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            backgroundColor: '#0f172a',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
            backdropFilter: 'blur(12px)',
            width: '100%',
            boxSizing: 'border-box'
        }}>
            <div style={{
                maxWidth: '1600px',
                margin: '0 auto',
                padding: '0 20px',
                height: '62px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px'
            }}>
                {/* Brand / Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <Link
                        to={dashboardPath}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            textDecoration: 'none',
                            color: '#ffffff'
                        }}
                    >
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '800',
                            fontSize: '18px',
                            color: '#ffffff',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
                        }}>
                            ⚡
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{
                                fontWeight: '700',
                                fontSize: '15px',
                                letterSpacing: '0.3px',
                                lineHeight: '1.2'
                            }}>
                                TaskManagement
                            </span>
                            <span style={{
                                fontSize: '11px',
                                color: '#94a3b8',
                                letterSpacing: '0.5px',
                                textTransform: 'uppercase'
                            }}>
                                Enterprise Workspace
                            </span>
                        </div>
                    </Link>

                    {/* Navigation Items */}
                    <nav style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        overflowX: 'auto'
                    }}>
                        {navItems.map(item => {
                            if (item.adminOnly && !isAdmin) return null;
                            const active = isActive(item.path);
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '7px 12px',
                                        borderRadius: '8px',
                                        fontSize: '13px',
                                        fontWeight: active ? '600' : '500',
                                        color: active ? '#ffffff' : '#94a3b8',
                                        backgroundColor: active ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                        border: active ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                                        textDecoration: 'none',
                                        transition: 'all 0.2s ease',
                                        whiteSpace: 'nowrap'
                                    }}
                                    onMouseOver={(e) => {
                                        if (!active) {
                                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                            e.currentTarget.style.color = '#ffffff';
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        if (!active) {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            e.currentTarget.style.color = '#94a3b8';
                                        }
                                    }}
                                >
                                    <span>{item.icon}</span>
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Right side: Notifications, User Profile, Role Badge, Logout */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {/* Notification Bell Dropdown */}
                    <div ref={notifRef} style={{ position: 'relative' }}>
                        <button
                            onClick={() => setIsNotifOpen(!isNotifOpen)}
                            style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                backgroundColor: isNotifOpen ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#ffffff',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '16px',
                                position: 'relative',
                                transition: 'all 0.15s ease'
                            }}
                            title="Notifications"
                        >
                            🔔
                            {unreadCount > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: '-4px',
                                    right: '-4px',
                                    backgroundColor: '#ef4444',
                                    color: '#ffffff',
                                    fontSize: '10px',
                                    fontWeight: '700',
                                    borderRadius: '10px',
                                    padding: '1px 5px',
                                    minWidth: '16px',
                                    textAlign: 'center',
                                    boxShadow: '0 2px 6px rgba(239, 68, 68, 0.5)'
                                }}>
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Dropdown Panel */}
                        {isNotifOpen && (
                            <div style={{
                                position: 'absolute',
                                right: 0,
                                top: '46px',
                                width: '360px',
                                backgroundColor: '#0f172a',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                borderRadius: '14px',
                                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                                zIndex: 1100,
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 16px',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                                    backgroundColor: 'rgba(0, 0, 0, 0.2)'
                                }}>
                                    <span style={{ fontWeight: '700', fontSize: '14px', color: '#ffffff' }}>
                                        Notifications {unreadCount > 0 && <span style={{ color: '#3b82f6' }}>({unreadCount})</span>}
                                    </span>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllRead}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#60a5fa',
                                                fontSize: '11px',
                                                cursor: 'pointer',
                                                fontWeight: '600'
                                            }}
                                        >
                                            Mark all as read
                                        </button>
                                    )}
                                </div>

                                <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
                                    {notifications.length === 0 ? (
                                        <div style={{ padding: '30px 20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                                            No notifications right now
                                        </div>
                                    ) : (
                                        notifications.map(n => (
                                            <div
                                                key={n.id}
                                                onClick={() => handleNotificationClick(n)}
                                                style={{
                                                    padding: '12px 16px',
                                                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                                                    backgroundColor: n.isRead ? 'transparent' : 'rgba(59, 130, 246, 0.06)',
                                                    cursor: 'pointer',
                                                    transition: 'background-color 0.15s ease'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = n.isRead ? 'transparent' : 'rgba(59, 130, 246, 0.06)'}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                    <span style={{
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        color: n.isRead ? '#cbd5e1' : '#ffffff'
                                                    }}>
                                                        {n.title}
                                                    </span>
                                                    {!n.isRead && (
                                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>
                                                    {n.message}
                                                </div>
                                                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '6px' }}>
                                                    {new Date(n.createdDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.createdDate).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)'
                    }}>
                        <div style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            background: isAdmin 
                                ? 'linear-gradient(135deg, #ec4899, #8b5cf6)' 
                                : 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontWeight: '700',
                            fontSize: '12px'
                        }}>
                            {userName ? userName[0].toUpperCase() : (isAdmin ? 'A' : 'U')}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#f8fafc',
                                lineHeight: '1.2'
                            }}>
                                {userName}
                            </span>
                            <span style={{
                                fontSize: '10px',
                                fontWeight: '700',
                                color: isAdmin ? '#c084fc' : '#38bdf8',
                                textTransform: 'uppercase',
                                letterSpacing: '0.4px'
                            }}>
                                {userRole}
                            </span>
                        </div>
                    </div>

                    <Link
                        to="/profile"
                        style={{
                            padding: '7px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#cbd5e1',
                            backgroundColor: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            textDecoration: 'none',
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
                            e.currentTarget.style.color = '#ffffff';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                            e.currentTarget.style.color = '#cbd5e1';
                        }}
                    >
                        Profile
                    </Link>

                    <button
                        onClick={handleLogout}
                        style={{
                            padding: '7px 14px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#f87171',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
                            e.currentTarget.style.color = '#fca5a5';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                            e.currentTarget.style.color = '#f87171';
                        }}
                    >
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
};

export default AppNavbar;
