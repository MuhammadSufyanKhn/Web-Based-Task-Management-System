import React from 'react';
import PropTypes from 'prop-types';
import { jwtDecode } from 'jwt-decode';

const ISSUE_TYPE_ICONS = {
    Bug: '🐞',
    Story: '📖',
    Epic: '⚡',
    Subtask: '↳',
    Task: '✅'
};

const PRIORITY_ICONS = {
    Highest: '⬆️',
    High: '🔼',
    Medium: '🟰',
    Low: '🔽',
    Lowest: '⬇️'
};

const BacklogIssueRow = ({
    issue,
    index,
    onIssueClick,
    onDragStart,
    onDragOver,
    onDrop,
    onPermissionDenied
}) => {
    // Current user context
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    let currentUserId = null;
    let isAdmin = false;
    if (token) {
        try {
            const decoded = jwtDecode(token);
            const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || 'User';
            isAdmin = role === 'Admin';
            currentUserId = parseInt(decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]);
        } catch {
            // Mock environments
        }
    }

    const isOwner = currentUserId && (issue.userId === currentUserId || issue.createdBy === currentUserId);
    const canMove = !token || isAdmin || isOwner;

    const handleDragStart = (e) => {
        if (!canMove) {
            e.preventDefault();
            if (onPermissionDenied) {
                onPermissionDenied({
                    action: 'move',
                    issue,
                    title: "You can't move this task",
                    message: `This task is assigned to ${issue.userName || 'another team member'}.`,
                    details: "Only the task owner or an administrator can move this task."
                });
            }
            return;
        }

        e.dataTransfer.setData('text/plain', JSON.stringify({
            taskId: issue.taskId,
            sourceSprintId: issue.sprintId,
            index
        }));
        e.dataTransfer.effectAllowed = 'move';
        if (onDragStart) onDragStart(issue, index);
    };

    const getStatusStyle = (category) => {
        switch (category) {
            case 'Done':
                return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
            case 'InProgress':
                return { bg: 'rgba(139, 92, 246, 0.15)', text: '#c4b5fd', border: 'rgba(139, 92, 246, 0.3)' };
            default:
                return { bg: 'rgba(99, 102, 241, 0.15)', text: '#a5b4fc', border: 'rgba(99, 102, 241, 0.3)' };
        }
    };

    const statusStyle = getStatusStyle(issue.statusCategory);

    return (
        <div
            draggable={canMove}
            onDragStart={handleDragStart}
            onDragOver={(e) => onDragOver && onDragOver(e, index)}
            onDrop={(e) => onDrop && onDrop(e, index)}
            onClick={() => onIssueClick(issue.taskId)}
            title={!canMove ? `Restricted: Assigned to ${issue.userName || 'another team member'}. Only the task owner or an administrator can move this task.` : undefined}
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 14px',
                backgroundColor: '#ffffff',
                borderBottom: '1px solid #e2edfb',
                cursor: canMove ? 'grab' : 'not-allowed',
                transition: 'background-color 0.15s ease',
                userSelect: 'none',
                gap: '12px',
                opacity: canMove ? 1 : 0.85
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f5fd'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
        >
            {/* Drag Handle */}
            <span style={{ color: canMove ? '#64748b' : '#94a3b8', cursor: canMove ? 'grab' : 'not-allowed', fontSize: '14px', letterSpacing: '-1px' }}>
                ⋮⋮
            </span>

            {/* Issue Type Icon */}
            <span title={issue.issueTypeName} style={{ fontSize: '15px' }}>
                {ISSUE_TYPE_ICONS[issue.issueTypeName] || '✅'}
            </span>

            {/* Issue Key */}
            <span style={{
                fontSize: '12px',
                fontWeight: '700',
                color: '#1d4ed8',
                minWidth: '65px'
            }}>
                {issue.issueKey}
            </span>

            {/* Lock Indicator if restricted */}
            {!canMove && (
                <span
                    title={`Restricted: Assigned to ${issue.userName}. Only the task owner or an administrator can move this task.`}
                    style={{
                        fontSize: '10px',
                        color: '#b45309',
                        backgroundColor: 'rgba(245, 158, 11, 0.12)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '4px',
                        padding: '1px 5px',
                        fontWeight: '600'
                    }}
                >
                    🔒 Locked
                </span>
            )}

            {/* Summary / Title */}
            <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#0f172a',
                flex: 1,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
            }}>
                {issue.title}
            </span>

            {/* Epic Badge */}
            {issue.epicName && (
                <span style={{
                    backgroundColor: issue.epicColor ? `${issue.epicColor}18` : 'rgba(29, 78, 216, 0.08)',
                    color: issue.epicColor || '#1d4ed8',
                    border: `1px solid ${issue.epicColor || '#1d4ed8'}40`,
                    borderRadius: '4px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: '700',
                    whiteSpace: 'nowrap'
                }}>
                    ⚡ {issue.epicName}
                </span>
            )}

            {/* Component Badge */}
            {issue.componentName && (
                <span style={{
                    backgroundColor: 'rgba(6, 182, 212, 0.12)',
                    color: '#0e7490',
                    border: '1px solid rgba(6, 182, 212, 0.28)',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    whiteSpace: 'nowrap'
                }}>
                    📦 {issue.componentName}
                </span>
            )}

            {/* Status Pill */}
            <span style={{
                backgroundColor: statusStyle.bg,
                color: statusStyle.text,
                border: `1px solid ${statusStyle.border}`,
                borderRadius: '4px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
                minWidth: '70px',
                textAlign: 'center'
            }}>
                {issue.statusDisplayName}
            </span>

            {/* Priority Icon */}
            <span title={`Priority: ${issue.priorityName}`} style={{ fontSize: '13px' }}>
                {PRIORITY_ICONS[issue.priorityName] || '🟰'}
            </span>

            {/* Story Points Circle */}
            <span style={{
                minWidth: '22px',
                height: '22px',
                borderRadius: '11px',
                backgroundColor: '#dbeafe',
                color: '#1e40af',
                border: '1px solid #bfdbfe',
                fontSize: '11px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }} title={`Story Points: ${issue.storyPoints ?? 'Unestimated'}`}>
                {issue.storyPoints ?? '-'}
            </span>

            {/* Assignee Avatar */}
            <div
                title={`Assignee: ${issue.userName}`}
                style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#1d4ed8',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textTransform: 'uppercase',
                    border: '1px solid #ffffff'
                }}
            >
                {issue.userName ? issue.userName.slice(0, 2) : '??'}
            </div>
        </div>
    );
};

BacklogIssueRow.propTypes = {
    issue: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
    onIssueClick: PropTypes.func.isRequired,
    onDragStart: PropTypes.func,
    onDragOver: PropTypes.func,
    onDrop: PropTypes.func,
    onPermissionDenied: PropTypes.func
};

export default BacklogIssueRow;
