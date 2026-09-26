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
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbdcf7',
                    borderRadius: '12px',
                    width: '100%',
                    maxWidth: '460px',
                    boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.25)',
                    overflow: 'hidden',
                    animation: 'scaleIn 0.2s ease-out',
                    color: '#0f172a'
                }}
            >
                {/* Header bar */}
                <div
                    style={{
                        padding: '16px 20px',
                        borderBottom: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: '#f8fafd'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                            style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                backgroundColor: '#fef3c7',
                                color: '#d97706',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '16px',
                                border: '1px solid #fde68a'
                            }}
                        >
                            🔒
                        </span>
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#d97706' }}>
                                Permission Notice
                            </div>
                            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#1e3a8a' }}>
                                {title}
                            </h4>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#64748b',
                            fontSize: '18px',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: '6px'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#0f172a'; e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.backgroundColor = 'transparent'; }}
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
                            backgroundColor: '#fffbeb',
                            border: '1px solid #fde68a',
                            marginBottom: '16px'
                        }}
                    >
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#b45309', marginBottom: '4px' }}>
                            {message}
                        </div>
                        <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
                            {details}
                        </div>
                    </div>

                    <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.6' }}>
                        Standard team members may only modify and advance tasks that are directly assigned to them or created by them. If this task needs reassigning or moving, please contact an Administrator.
                    </div>
                </div>

                {/* Footer */}
                <div
                    style={{
                        padding: '12px 20px',
                        borderTop: '1px solid #e2e8f0',
                        backgroundColor: '#f8fafd',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '10px'
                    }}
                >
                    <button
                        onClick={onClose}
                        style={{
                            backgroundColor: '#1d4ed8',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 18px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: '0 2px 4px rgba(29, 78, 216, 0.25)',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e40af'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
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
