import React from 'react';
import PropTypes from 'prop-types';

const BreakdownBarChart = ({ items, title, emptyMessage = 'No data available' }) => {
    if (!items || items.length === 0) {
        return (
            <div style={{ padding: '24px', textAlign: 'center', color: '#6b778c', fontSize: '13px' }}>
                {emptyMessage}
            </div>
        );
    }

    const maxCount = Math.max(1, ...items.map(i => i.count || 0));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {title && (
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#172b4d', marginBottom: '4px' }}>
                    {title}
                </div>
            )}

            {items.map((item, idx) => {
                const barWidth = Math.max(2, Math.round(((item.count || 0) / maxCount) * 100));
                return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    backgroundColor: item.colorHex || '#0052cc',
                                    display: 'inline-block'
                                }} />
                                <span style={{ fontWeight: '600', color: '#172b4d' }}>
                                    {item.displayName || item.name}
                                </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
                                {item.storyPoints !== undefined && item.storyPoints > 0 && (
                                    <span style={{ color: '#5e6c84' }}>
                                        {item.storyPoints} pts
                                    </span>
                                )}
                                <span style={{
                                    backgroundColor: '#f4f5f7',
                                    color: '#172b4d',
                                    fontWeight: '700',
                                    padding: '1px 8px',
                                    borderRadius: '10px'
                                }}>
                                    {item.count}
                                </span>
                                <span style={{ color: '#6b778c', minWidth: '40px', textAlign: 'right' }}>
                                    {item.percentage}%
                                </span>
                            </div>
                        </div>

                        <div style={{
                            height: '7px',
                            backgroundColor: '#ebecf0',
                            borderRadius: '4px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${barWidth}%`,
                                height: '100%',
                                backgroundColor: item.colorHex || '#0052cc',
                                borderRadius: '4px',
                                transition: 'width 0.4s ease'
                            }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

BreakdownBarChart.propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string,
        displayName: PropTypes.string,
        colorHex: PropTypes.string,
        count: PropTypes.number,
        percentage: PropTypes.number,
        storyPoints: PropTypes.number
    })),
    title: PropTypes.string,
    emptyMessage: PropTypes.string
};

export default BreakdownBarChart;
