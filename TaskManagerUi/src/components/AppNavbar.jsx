import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

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

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const dashboardPath = isAdmin ? '/Admin-dashboard' : '/dashboard';

    const navItems = [
        { path: dashboardPath, label: 'Dashboard', icon: '📊', adminOnly: false },
        { path: '/kanban', label: 'Kanban', icon: '📋', adminOnly: false },
        { path: '/backlog', label: 'Backlog', icon: '📖', adminOnly: false },
        { path: '/reports', label: 'Reports', icon: '📈', adminOnly: false },
        { path: '/project-settings', label: 'Project Settings', icon: '⚙️', adminOnly: true },
        { path: '/AllUsersList', label: 'Users', icon: '👥', adminOnly: true },
        { path: '/AdminAllTasks', label: 'All Tasks', icon: '📑', adminOnly: true }
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

                {/* Right side: User Profile, Role Badge, Logout */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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
