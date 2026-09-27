import React, { useState } from 'react';
import PropTypes from 'prop-types';
import KanbanCard from './KanbanCard';

const KanbanColumn = ({
    column,
    onCardClick,
    onCardMove,
    onQuickCreate,
    onPermissionDenied
}) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    const handleDragOver = (e, targetIndex = null) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setIsDragOver(true);
        if (targetIndex !== null) {
            setDragOverIndex(targetIndex);
        }
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
        setDragOverIndex(null);
    };

    const handleDrop = (e, targetIndex = null) => {
        e.preventDefault();
        setIsDragOver(false);
        setDragOverIndex(null);

        const dataStr = e.dataTransfer.getData('text/plain');
        if (!dataStr) return;

        try {
            const data = JSON.parse(dataStr);
            const dropIndex = targetIndex !== null ? targetIndex : column.cards.length;
            onCardMove(data.taskId, column.id, dropIndex);
        } catch (err) {
            console.error('Invalid drop data:', err);
        }
    };

    // Use refined theme status accent colors
    const getStatusAccent = () => {
        if (column.colorHex && column.colorHex !== '#6c757d') {
            return column.colorHex;
        }
        switch (column.category) {
            case 'Todo': return '#6366f1'; // Indigo
            case 'Done': return '#10b981'; // Emerald
            default:
                if (column.name === 'InReview' || column.displayName?.toLowerCase().includes('review')) {
                    return '#f59e0b'; // Amber
                }
                return '#8b5cf6'; // Electric Violet
        }
    };

    const accentColor = getStatusAccent();

    return (
        <div
            className="jira-column"
            onDragOver={(e) => handleDragOver(e, null)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, null)}
            style={{
                flex: '0 0 310px',
                width: '310px',
                backgroundColor: isDragOver ? 'rgba(29, 78, 216, 0.08)' : '#f0f5fd',
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: 'calc(100vh - 190px)',
                border: isDragOver ? '2px dashed #1d4ed8' : '1px solid #cbdcf7',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                transition: 'background-color 0.2s, border-color 0.2s',
                boxSizing: 'border-box'
            }}
        >
            {/* Column Header: column name + issue count badge + "+" quick-add icon */}
            <div style={{
                padding: '14px 16px 10px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: `4px solid ${accentColor}`,
                borderTopLeftRadius: '8px',
                borderTopRightRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.85)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                        fontSize: '13px',
                        fontWeight: '700',
                        color: '#0f172a',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px'
                    }}>
                        {column.displayName}
                    </span>
                    <span style={{
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        border: '1px solid #bfdbfe',
                        borderRadius: '10px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: '700'
                    }}>
                        {column.cards.length}
                    </span>
                </div>

                <button
                    onClick={() => onQuickCreate(column.id)}
                    title="Quick create issue in this column"
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        fontSize: '18px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        lineHeight: '1',
                        transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#dbeafe';
                        e.target.style.color = '#1d4ed8';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = '#64748b';
                    }}
                >
                    +
                </button>
            </div>

            {/* Droppable Card List */}
            <div style={{
                padding: '10px 12px 14px 12px',
                overflowY: 'auto',
                flex: 1,
                minHeight: '80px',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {column.cards.map((card, idx) => (
                    <React.Fragment key={card.taskId}>
                        {dragOverIndex === idx && (
                            <div style={{
                                height: '4px',
                                backgroundColor: '#1d4ed8',
                                borderRadius: '2px',
                                marginBottom: '8px',
                                boxShadow: '0 0 8px rgba(29, 78, 216, 0.5)'
                            }} />
                        )}
                        <KanbanCard
                            card={card}
                            index={idx}
                            onCardClick={onCardClick}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            onDrop={(e) => handleDrop(e, idx)}
                            onPermissionDenied={onPermissionDenied}
                        />
                    </React.Fragment>
                ))}

                {column.cards.length === 0 && (
                    <div style={{
                        padding: '36px 12px',
                        textAlign: 'center',
                        color: '#64748b',
                        fontSize: '13px',
                        fontStyle: 'italic',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        <span style={{ fontSize: '18px', opacity: 0.6 }}>📥</span>
                        <span>No issues in this column</span>
                    </div>
                )}
            </div>

            {/* Column Footer: Quick add button */}
            <div style={{ padding: '8px 12px 12px 12px' }}>
                <button
                    onClick={() => onQuickCreate(column.id)}
                    style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '6px',
                        color: '#475569',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#dbeafe';
                        e.currentTarget.style.color = '#1d4ed8';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#475569';
                    }}
                >
                    <span style={{ fontSize: '15px' }}>+</span> Create issue
                </button>
            </div>
        </div>
    );
};

KanbanColumn.propTypes = {
    column: PropTypes.object.isRequired,
    onCardClick: PropTypes.func.isRequired,
    onCardMove: PropTypes.func.isRequired,
    onQuickCreate: PropTypes.func.isRequired,
    onPermissionDenied: PropTypes.func
};

export default KanbanColumn;
