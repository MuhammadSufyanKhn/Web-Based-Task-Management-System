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

const KanbanCard = ({
    card,
    index,
    onCardClick,
    onDragStart,
    onDragOver,
    onDrop
}) => {
    const handleDragStart = (e) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({ taskId: card.taskId, sourceStatusId: card.statusId, index }));
        e.dataTransfer.effectAllowed = 'move';
        if (onDragStart) onDragStart(card, index);
    };

    const isOverdue = card.dueDate && new Date(card.dueDate) < new Date() && card.statusDisplayName !== 'Done';

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onDragOver={(e) => onDragOver && onDragOver(e, index)}
            onDrop={(e) => onDrop && onDrop(e, index)}
            onClick={() => onCardClick(card.taskId)}
            className="jira-card"
            style={{
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '10px',
                boxShadow: '0 1px 3px rgba(9, 30, 66, 0.15), 0 0 1px rgba(9, 30, 66, 0.31)',
                cursor: 'grab',
                borderLeft: `4px solid ${card.priorityColor || '#ffab00'}`,
                transition: 'box-shadow 0.2s ease, transform 0.15s ease',
                userSelect: 'none'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(9, 30, 66, 0.25)';
                e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(9, 30, 66, 0.15), 0 0 1px rgba(9, 30, 66, 0.31)';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            {/* Top row: Type Icon + Issue Key + Story Points */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span title={card.issueTypeName} style={{ fontSize: '14px' }}>
                        {ISSUE_TYPE_ICONS[card.issueTypeName] || '✅'}
                    </span>
                    <span style={{
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#5e6c84',
                        letterSpacing: '0.3px'
                    }}>
                        {card.issueKey}
                    </span>
                </div>

                {card.storyPoints !== null && card.storyPoints !== undefined && (
                    <span style={{
                        backgroundColor: '#dfe1e6',
                        color: '#172b4d',
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
                color: '#172b4d',
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
                            backgroundColor: card.epicColor ? `${card.epicColor}22` : '#eae6ff',
                            color: card.epicColor || '#403294',
                            border: `1px solid ${card.epicColor || '#403294'}55`,
                            borderRadius: '3px',
                            padding: '1px 6px',
                            fontSize: '11px',
                            fontWeight: '700'
                        }}>
                            ⚡ {card.epicName}
                        </span>
                    )}
                    {card.componentName && (
                        <span style={{
                            backgroundColor: '#e6fcff',
                            color: '#008da6',
                            border: '1px solid #b3f5ff',
                            borderRadius: '3px',
                            padding: '1px 6px',
                            fontSize: '11px',
                            fontWeight: '600'
                        }}>
                            📦 {card.componentName}
                        </span>
                    )}
                    {card.labels && card.labels.map((lbl, idx) => (
                        <span key={idx} style={{
                            backgroundColor: '#eae6ff',
                            color: '#403294',
                            borderRadius: '3px',
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
                            padding: '2px 5px',
                            borderRadius: '3px',
                            backgroundColor: isOverdue ? '#ffebe6' : '#f4f5f7',
                            color: isOverdue ? '#de350b' : '#5e6c84'
                        }} title={isOverdue ? 'Overdue!' : 'Due Date'}>
                            📅 {new Date(card.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                    )}
                </div>

                {/* Assignee Avatar */}
                <div
                    title={`Assigned to: ${card.userName} (${card.userEmail})`}
                    style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: '#0052cc',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: '700',
                        textTransform: 'uppercase'
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
    onDrop: PropTypes.func
};

export default KanbanCard;
