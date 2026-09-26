import React from 'react';
import PropTypes from 'prop-types';

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
    onDrop
}) => {
    const handleDragStart = (e) => {
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
                return { bg: '#e3fcef', text: '#006644', border: '#abf5d1' };
            case 'InProgress':
                return { bg: '#deebff', text: '#0747a6', border: '#b3d4ff' };
            default:
                return { bg: '#dfe1e6', text: '#42526e', border: '#c1c7d0' };
        }
    };

    const statusStyle = getStatusStyle(issue.statusCategory);

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onDragOver={(e) => onDragOver && onDragOver(e, index)}
            onDrop={(e) => onDrop && onDrop(e, index)}
            onClick={() => onIssueClick(issue.taskId)}
            style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 14px',
                backgroundColor: '#ffffff',
                borderBottom: '1px solid #ebecf0',
                cursor: 'grab',
                transition: 'background-color 0.15s ease',
                userSelect: 'none',
                gap: '12px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f4f5f7'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
        >
            {/* Drag Handle */}
            <span style={{ color: '#a5adba', cursor: 'grab', fontSize: '14px', letterSpacing: '-1px' }}>
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
                color: '#5e6c84',
                minWidth: '65px'
            }}>
                {issue.issueKey}
            </span>

            {/* Summary / Title */}
            <span style={{
                fontSize: '14px',
                fontWeight: '500',
                color: '#172b4d',
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
                    backgroundColor: issue.epicColor ? `${issue.epicColor}22` : '#eae6ff',
                    color: issue.epicColor || '#403294',
                    border: `1px solid ${issue.epicColor || '#403294'}55`,
                    borderRadius: '3px',
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
                    backgroundColor: '#e6fcff',
                    color: '#008da6',
                    borderRadius: '3px',
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
                borderRadius: '3px',
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
                backgroundColor: '#dfe1e6',
                color: '#172b4d',
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
                    backgroundColor: '#0052cc',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textTransform: 'uppercase'
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
    onDrop: PropTypes.func
};

export default BacklogIssueRow;
