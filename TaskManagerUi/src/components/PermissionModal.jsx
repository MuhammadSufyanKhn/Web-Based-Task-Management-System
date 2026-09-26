import React from 'react';
import PropTypes from 'prop-types';

const PermissionModal = ({
    isOpen,
    title = "You can't move this task",
    message = "This task is assigned to another team member.",
    details = "Only the task owner or an administrator can move this task.",
    onClose
}) => {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                backdropFilter: 'blur(5px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2000,
                padding: '16px'
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                style={{
                    backgroundColor: '#111827',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    width: '100%',
                    maxWidth: '460px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 25px rgba(245, 158, 11, 0.15)',
                    overflow: 'hidden',
                    animation: 'scaleIn 0.2s ease-out',
                    color: '#f8fafc'
                }}
            >
                {/* Header bar */}
                <div
                    style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#161f30'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                color: '#f59e0b',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '16px',
                                border: '1px solid rgba(245, 158, 11, 0.3)'
                            }}
                        >
                            🔒
                        </span>
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#f59e0b' }}>
                                Permission Notice
                            </div>
                            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#f8fafc' }}>
                                {title}
                            </h4>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#94a3b8',
                            fontSize: '18px',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '6px'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                        ✕
                    </button>
                </div>

                {/* Body Content */}
                <div style={{ padding: '20px' }}>
                    <div
                        style={{
                            padding: '12px 14px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(245, 158, 11, 0.08)',
                            border: '1px solid rgba(245, 158, 11, 0.25)',
                            marginBottom: '16px'
                        }}
                    >
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#fbbf24', marginBottom: '4px' }}>
                            {message}
                        </div>
                        <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5' }}>
                            {details}
                        </div>
                    </div>

                    <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.6' }}>
                        Standard team members may only modify and advance tasks that are directly assigned to them or created by them. If this task needs reassigning or moving, please contact an Administrator.
                    </div>
                </div>

                {/* Footer */}
                <div
                    style={{
                        padding: '12px 20px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        backgroundColor: '#161f30',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '10px'
                    }}
                >
                    <button
                        onClick={onClose}
                        style={{
                            backgroundColor: '#6366f1',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 18px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(99, 102, 241, 0.4)',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6366f1'}
                    >
                        Got It
                    </button>
                </div>
            </div>
        </div>
    );
};

PermissionModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    title: PropTypes.string,
    message: PropTypes.string,
    details: PropTypes.string,
    onClose: PropTypes.func.isRequired
};

export default PermissionModal;
