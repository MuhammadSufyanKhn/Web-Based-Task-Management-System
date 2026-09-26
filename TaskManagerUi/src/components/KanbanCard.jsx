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

const KanbanCard = ({
    card,
    index,
    onCardClick,
    onDragStart,
    onDragOver,
    onDrop,
    onPermissionDenied
}) => {
    // Determine permissions
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
            // Ignore decode error in mock environments
        }
    }

    const hasAuth = !!token;
    const isOwner = currentUserId && (card.userId === currentUserId || card.createdBy === currentUserId);
    const canMove = !hasAuth || isAdmin || isOwner;

    const handleDragStart = (e) => {
        if (!canMove) {
            e.preventDefault();
            if (onPermissionDenied) {
                onPermissionDenied({
                    action: 'move',
                    card,
                    title: "You can't move this task",
                    message: `This task is assigned to ${card.userName || 'another team member'}.`,
                    details: "Only the task owner or an administrator can move this task."
                });
            }
            return;
        }

        e.dataTransfer.setData('text/plain', JSON.stringify({ taskId: card.taskId, sourceStatusId: card.statusId, index }));
        e.dataTransfer.effectAllowed = 'move';
        if (onDragStart) onDragStart(card, index);
    };

    const isOverdue = card.dueDate && new Date(card.dueDate) < new Date() && card.statusDisplayName !== 'Done';

    return (
        <div
            draggable={canMove}
            onDragStart={handleDragStart}
            onDragOver={(e) => onDragOver && onDragOver(e, index)}
            onDrop={(e) => onDrop && onDrop(e, index)}
            onClick={() => onCardClick(card.taskId)}
            className="jira-card"
            title={!canMove ? `Restricted: Assigned to ${card.userName || 'another team member'}. Only the task owner or an administrator can move this task.` : undefined}
            style={{
                backgroundColor: '#1e293b',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '10px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.06)',
                cursor: canMove ? 'grab' : 'not-allowed',
                borderLeft: `4px solid ${card.priorityColor || '#6366f1'}`,
                transition: 'box-shadow 0.2s ease, transform 0.15s ease, border-color 0.2s ease',
                userSelect: 'none',
                opacity: canMove ? 1 : 0.88,
                position: 'relative'
            }}
            onMouseEnter={(e) => {
                if (canMove) {
                    e.currentTarget.style.boxShadow = '0 8px 18px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(99, 102, 241, 0.35)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                } else {
                    e.currentTarget.style.boxShadow = '0 4px 10px rgba(245, 158, 11, 0.2), 0 0 0 1px rgba(245, 158, 11, 0.4)';
                }
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            {/* Top row: Type Icon + Issue Key + (Restricted Indicator) + Story Points */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span title={card.issueTypeName} style={{ fontSize: '14px' }}>
                        {ISSUE_TYPE_ICONS[card.issueTypeName] || '✅'}
                    </span>
                    <span style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#94a3b8',
                        letterSpacing: '0.3px'
                    }}>
                        {card.issueKey}
                    </span>

                    {/* Restricted Lock Indicator */}
                    {!canMove && (
                        <span
                            title={`Restricted: Assigned to ${card.userName || 'another user'}. Only the task owner or an administrator can move this task.`}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '10px',
                                color: '#fbbf24',
                                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                fontWeight: '600'
                            }}
                        >
                            🔒 Locked
                        </span>
                    )}
                </div>

                {card.storyPoints !== null && card.storyPoints !== undefined && (
                    <span style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        color: '#e2e8f0',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        padding: '1px 6px',
                        fontSize: '11px',
                        fontWeight: '700'
                    }} title={`Story Points: ${card.storyPoints}`}>
                        {card.storyPoints} pts
                    </span>
                )}
            </div>

            {/* Title */}
            <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#f8fafc',
                lineHeight: '1.4',
                marginBottom: '8px',
                wordBreak: 'break-word'
            }}>
                {card.title}
            </div>

            {/* Epic, Labels, and Component Chips */}
            {(card.epicName || card.componentName || (card.labels && card.labels.length > 0)) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                    {card.epicName && (
                        <span style={{
                            backgroundColor: card.epicColor ? `${card.epicColor}22` : 'rgba(99, 102, 241, 0.15)',
                            color: card.epicColor || '#a5b4fc',
                            border: `1px solid ${card.epicColor || '#6366f1'}55`,
                            borderRadius: '4px',
                            padding: '1px 6px',
                            fontSize: '11px',
                            fontWeight: '700'
                        }}>
                            ⚡ {card.epicName}
                        </span>
                    )}
                    {card.componentName && (
                        <span style={{
                            backgroundColor: 'rgba(6, 182, 212, 0.15)',
                            color: '#22d3ee',
                            border: '1px solid rgba(6, 182, 212, 0.3)',
                            borderRadius: '4px',
                            padding: '1px 6px',
                            fontSize: '11px',
                            fontWeight: '600'
                        }}>
                            📦 {card.componentName}
                        </span>
                    )}
                    {card.labels && card.labels.map((lbl, idx) => (
                        <span key={idx} style={{
                            backgroundColor: 'rgba(139, 92, 246, 0.15)',
                            color: '#c4b5fd',
                            border: '1px solid rgba(139, 92, 246, 0.25)',
                            borderRadius: '4px',
                            padding: '1px 6px',
                            fontSize: '11px',
                            fontWeight: '600'
                        }}>
                            {lbl}
                        </span>
                    ))}
                </div>
            )}

            {/* Footer row: Priority + Due Date + Assignee Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span title={`Priority: ${card.priorityName}`} style={{ fontSize: '13px' }}>
                        {PRIORITY_ICONS[card.priorityName] || '🟰'}
                    </span>

                    {card.dueDate && (
                        <span style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: isOverdue ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                            color: isOverdue ? '#f87171' : '#94a3b8',
                            border: isOverdue ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)'
                        }} title={isOverdue ? 'Overdue!' : 'Due Date'}>
                            📅 {new Date(card.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                    )}
                </div>

                {/* Assignee Avatar */}
                <div
                    title={`Assigned to: ${card.userName} (${card.userEmail})`}
                    style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        backgroundColor: '#6366f1',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
                    }}
                >
                    {card.userName ? card.userName.slice(0, 2) : '??'}
                </div>
            </div>
        </div>
    );
};

KanbanCard.propTypes = {
    card: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
    onCardClick: PropTypes.func.isRequired,
    onDragStart: PropTypes.func,
    onDragOver: PropTypes.func,
    onDrop: PropTypes.func,
    onPermissionDenied: PropTypes.func
};

export default KanbanCard;
