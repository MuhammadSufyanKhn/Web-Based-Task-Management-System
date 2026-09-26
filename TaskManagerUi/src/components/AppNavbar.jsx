import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../Api/Axios';

// ── SVG Icons (inline, no external dep) ─────────────────────
const Icon = ({ d, size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
    </svg>
);

const Icons = {
    dashboard: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10',
    kanban:    'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',
    list:      'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',
    calendar:  'M8 2v4 M16 2v4 M3 8h18 M21 6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6z',
    timeline:  'M3 12h18 M3 6l5 6-5 6 M21 6l-5 6 5 6',
    gantt:     'M3 5h7 M3 9h5 M3 13h8 M3 17h4 M14 5h7 M14 9h3 M14 13h5 M14 17h6',
    backlog:   'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2',
    reports:   'M18 20V10 M12 20V4 M6 20v-6',
    settings:  'M12 20a8 8 0 100-16 8 8 0 000 16z M12 14a2 2 0 100-4 2 2 0 000 4z',
    users:     'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75',
    bell:      'M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0',
    profile:   'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z',
    logout:    'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9',
    chevron:   'M9 18l6-6-6-6',
};

const SideIcon = ({ name, size = 15 }) => <Icon d={Icons[name] || Icons.dashboard} size={size} />;

// ── Nav configuration ─────────────────────────────────────────
const NAV_GROUPS = [
    {
        label: 'PROJECT',
        items: [
            { path: '/kanban',   label: 'Board',     icon: 'kanban',   adminOnly: false },
            { path: '/backlog',  label: 'Backlog',   icon: 'backlog',  adminOnly: false },
            { path: '/list',     label: 'List',      icon: 'list',     adminOnly: false },
            { path: '/calendar', label: 'Calendar',  icon: 'calendar', adminOnly: false },
            { path: '/timeline', label: 'Timeline',  icon: 'timeline', adminOnly: false },
            { path: '/gantt',    label: 'Gantt',     icon: 'gantt',    adminOnly: false },
        ]
    },
    {
        label: 'INSIGHTS',
        items: [
            { path: '/reports',  label: 'Reports',   icon: 'reports',  adminOnly: false },
        ]
    },
    {
        label: 'ADMIN',
        adminSection: true,
        items: [
            { path: '/project-settings', label: 'Settings', icon: 'settings', adminOnly: true },
            { path: '/AllUsersList',     label: 'Users',    icon: 'users',    adminOnly: true },
        ]
    }
];

const AppNavbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const notifRef = useRef(null);

    // Decode token
    const token = localStorage.getItem('token');
    let userRole = 'User';
    let userName = 'User';
    let userInitials = 'U';

    if (token) {
        try {
            const decoded = jwtDecode(token);
            userRole = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || 'User';
            userName = decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/name'] ||
                (decoded.sub ? decoded.sub.split('@')[0] : (userRole === 'Admin' ? 'Administrator' : 'Team Member'));
            userInitials = userName.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
        } catch {
            userRole = 'User';
            userName = 'User';
            userInitials = 'U';
        }
    }

    const isAdmin = userRole === 'Admin';
    const dashboardPath = isAdmin ? '/Admin-dashboard' : '/dashboard';

    // Notifications
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    const fetchNotifications = async () => {
        if (!token) return;
        try {
            const res = await api.get('/notifications');
            if (res.data) {
                setNotifications(res.data.notifications || []);
                setUnreadCount(res.data.unreadCount || 0);
            }
        } catch { /* Non-blocking */ }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
            } catch { /* ignore */ }
        }
        setIsNotifOpen(false);
        if (notif.taskId) navigate('/kanban');
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const isActive = (path) => {
        if (path === dashboardPath && (
            location.pathname === '/dashboard' ||
            location.pathname === '/Admin-dashboard'
        )) return true;
        return location.pathname === path;
    };

    return (
        <aside className="sidebar" aria-label="Main navigation">
            {/* Brand */}
            <div className="sidebar-brand">
                <Link to={dashboardPath} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                    <div className="sidebar-logo">N</div>
                    <div className="sidebar-brand-text">
                        <span className="sidebar-brand-name">Nexus</span>
                        <span className="sidebar-brand-sub">Task Manager</span>
                    </div>
                </Link>
            </div>

            {/* Dashboard link */}
            <div style={{ padding: '8px 8px 0 8px' }}>
                <Link
                    to={dashboardPath}
                    className={`sidebar-link${isActive(dashboardPath) ? ' active' : ''}`}
                >
                    <span className="sidebar-link-icon"><SideIcon name="dashboard" /></span>
                    <span>Dashboard</span>
                </Link>
            </div>

            {/* Nav Groups */}
            {NAV_GROUPS.map(group => {
                // Hide admin-only section for non-admins
                if (group.adminSection && !isAdmin) return null;
                const visibleItems = group.items.filter(item => !item.adminOnly || isAdmin);
                if (visibleItems.length === 0) return null;

                return (
                    <div key={group.label} className="sidebar-section">
                        <div className="sidebar-section-label">{group.label}</div>
                        <nav className="sidebar-nav" aria-label={group.label}>
                            {visibleItems.map(item => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`sidebar-link${isActive(item.path) ? ' active' : ''}`}
                                    aria-current={isActive(item.path) ? 'page' : undefined}
                                >
                                    <span className="sidebar-link-icon"><SideIcon name={item.icon} /></span>
                                    <span>{item.label}</span>
                                </Link>
                            ))}
                        </nav>
                    </div>
                );
            })}

            {/* Footer: Notifications + User + Logout */}
            <div className="sidebar-footer">
                {/* Notification Bell */}
                <div ref={notifRef} style={{ position: 'relative', marginBottom: 4 }}>
                    <button
                        id="notification-bell"
                        onClick={() => setIsNotifOpen(!isNotifOpen)}
                        className="sidebar-link"
                        style={{
                            width: '100%',
                            border: 'none',
                            cursor: 'pointer',
                            background: isNotifOpen ? 'var(--bg-elevated)' : 'transparent',
                            position: 'relative',
                        }}
                        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                    >
                        <span className="sidebar-link-icon" style={{ position: 'relative' }}>
                            <SideIcon name="bell" />
                            {unreadCount > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: -4,
                                    right: -4,
                                    width: 14,
                                    height: 14,
                                    borderRadius: '50%',
                                    background: 'var(--danger)',
                                    color: '#fff',
                                    fontSize: 9,
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
                            )}
                        </span>
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                            <span className="badge badge-danger" style={{ marginLeft: 'auto', fontSize: 10 }}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {isNotifOpen && (
                        <div style={{
                            position: 'absolute',
                            left: 'calc(100% + 8px)',
                            bottom: 0,
                            width: 340,
                            background: 'var(--bg-overlay)',
                            border: '1px solid var(--bg-border)',
                            borderRadius: 'var(--radius-xl)',
                            boxShadow: 'var(--shadow-lg)',
                            zIndex: 1100,
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 16px',
                                borderBottom: '1px solid var(--bg-border)',
                            }}>
                                <span style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--text-primary)' }}>
                                    Notifications
                                    {unreadCount > 0 && (
                                        <span style={{ color: 'var(--accent-muted)', marginLeft: 6 }}>({unreadCount})</span>
                                    )}
                                </span>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllRead}
                                        style={{ background: 'none', border: 'none', color: 'var(--accent-muted)', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>
                            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                                {notifications.length === 0 ? (
                                    <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 'var(--text-base)' }}>
                                        No notifications
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div
                                            key={n.id}
                                            onClick={() => handleNotificationClick(n)}
                                            style={{
                                                padding: '10px 16px',
                                                borderBottom: '1px solid var(--bg-border-subtle)',
                                                backgroundColor: n.isRead ? 'transparent' : 'var(--accent-subtle)',
                                                cursor: 'pointer',
                                                transition: 'var(--transition-fast)',
                                            }}
                                            onMouseOver={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                                            onMouseOut={e => e.currentTarget.style.background = n.isRead ? 'transparent' : 'var(--accent-subtle)'}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                                                <span style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: n.isRead ? 'var(--text-secondary)' : 'var(--text-primary)' }}>
                                                    {n.title}
                                                </span>
                                                {!n.isRead && (
                                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', marginTop: 5, flexShrink: 0 }} />
                                                )}
                                            </div>
                                            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{n.message}</div>
                                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 4 }}>
                                                {new Date(n.createdDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(n.createdDate).toLocaleDateString()}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* User Block */}
                <Link to="/profile" className="sidebar-user" aria-label="View profile">
                    <div
                        className="user-avatar"
                        style={{ background: isAdmin ? 'var(--accent)' : '#0ea5e9' }}
                    >
                        {userInitials}
                    </div>
                    <div className="user-info">
                        <span className="user-name">{userName}</span>
                        <span className="user-role" style={{ color: isAdmin ? 'var(--accent-muted)' : 'var(--info-text)' }}>
                            {userRole}
                        </span>
                    </div>
                </Link>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="sidebar-link btn-ghost"
                    id="logout-btn"
                    style={{
                        width: '100%',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--danger-text)',
                        marginTop: 4,
                    }}
                    aria-label="Sign out"
                >
                    <span className="sidebar-link-icon"><SideIcon name="logout" /></span>
                    <span>Sign out</span>
                </button>
            </div>
        </aside>
    );
};

export default AppNavbar;
