import React, { useState } from 'react';
import PropTypes from 'prop-types';
import KanbanCard from './KanbanCard';

const KanbanColumn = ({
    column,
    onCardClick,
    onCardMove,
    onQuickCreate
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

    const getCategoryBadge = (cat) => {
        switch (cat) {
            case 'Todo': return { bg: '#dfe1e6', text: '#42526e' };
            case 'Done': return { bg: '#e3fcef', text: '#006644' };
            default: return { bg: '#deebff', text: '#0747a6' };
        }
    };

    const catBadge = getCategoryBadge(column.category);

    return (
        <div
            className="jira-column"
            onDragOver={(e) => handleDragOver(e, null)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, null)}
            style={{
                flex: '0 0 310px',
                width: '310px',
                backgroundColor: isDragOver ? '#ebecf0' : '#f4f5f7',
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: 'calc(100vh - 190px)',
                border: isDragOver ? '2px dashed #0052cc' : '2px solid transparent',
                transition: 'background-color 0.2s, border-color 0.2s',
                boxSizing: 'border-box'
            }}
        >
            {/* Column Header */}
            <div style={{
                padding: '14px 16px 10px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: `4px solid ${column.colorHex || '#6c757d'}`,
                borderTopLeftRadius: '8px',
                borderTopRightRadius: '8px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                        fontSize: '13px',
                        fontWeight: '700',
                        color: '#5e6c84',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px'
                    }}>
                        {column.displayName}
                    </span>
                    <span style={{
                        backgroundColor: catBadge.bg,
                        color: catBadge.text,
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
                        color: '#5e6c84',
                        cursor: 'pointer',
                        fontSize: '16px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        lineHeight: '1'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#dfe1e6'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                    +
                </button>
            </div>

            {/* Droppable Card List */}
            <div style={{
                padding: '0 12px',
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
                                backgroundColor: '#0052cc',
                                borderRadius: '2px',
                                marginBottom: '8px'
                            }} />
                        )}
                        <KanbanCard
                            card={card}
                            index={idx}
                            onCardClick={onCardClick}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            onDrop={(e) => handleDrop(e, idx)}
                        />
                    </React.Fragment>
                ))}

                {column.cards.length === 0 && (
                    <div style={{
                        padding: '30px 10px',
                        textAlign: 'center',
                        color: '#8993a4',
                        fontSize: '13px',
                        fontStyle: 'italic'
                    }}>
                        No issues in this column
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
                        color: '#5e6c84',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#ebecf0';
                        e.currentTarget.style.color = '#172b4d';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#5e6c84';
                    }}
                >
                    <span>+</span> Create issue
                </button>
            </div>
        </div>
    );
};

KanbanColumn.propTypes = {
    column: PropTypes.object.isRequired,
    onCardClick: PropTypes.func.isRequired,
    onCardMove: PropTypes.func.isRequired,
    onQuickCreate: PropTypes.func.isRequired
};

export default KanbanColumn;
