import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

const ViewSwitcher = ({ rightContent }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const views = [
        { path: '/kanban', label: 'Board', icon: '📋' },
        { path: '/list', label: 'List', icon: '📑' },
        { path: '/calendar', label: 'Calendar', icon: '📅' },
        { path: '/timeline', label: 'Timeline', icon: '⏱️' },
        { path: '/gantt', label: 'Gantt', icon: '📊' },
        { path: '/backlog', label: 'Backlog', icon: '📖' }
    ];

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '18px',
            padding: '8px 12px',
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            backdropFilter: 'blur(8px)'
        }}>
            {/* View Pills */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                padding: '3px',
                borderRadius: '10px'
            }}>
                {views.map(view => {
                    const isActive = location.pathname === view.path;
                    return (
                        <button
                            key={view.path}
                            onClick={() => navigate(view.path)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 14px',
                                borderRadius: '8px',
                                border: 'none',
                                fontSize: '13px',
                                fontWeight: isActive ? '600' : '500',
                                color: isActive ? '#ffffff' : '#94a3b8',
                                backgroundColor: isActive ? '#3b82f6' : 'transparent',
                                boxShadow: isActive ? '0 2px 8px rgba(59, 130, 246, 0.35)' : 'none',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                            onMouseOver={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.color = '#ffffff';
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                                }
                            }}
                            onMouseOut={(e) => {
                                if (!isActive) {
                                    e.currentTarget.style.color = '#94a3b8';
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }
                            }}
                        >
                            <span>{view.icon}</span>
                            <span>{view.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Optional right-aligned actions (e.g. Filters, Create Button) */}
            {rightContent && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {rightContent}
                </div>
            )}
        </div>
    );
};

ViewSwitcher.propTypes = {
    rightContent: PropTypes.node
};

export default ViewSwitcher;
