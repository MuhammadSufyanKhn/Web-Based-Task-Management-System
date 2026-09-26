import React from 'react';
import PropTypes from 'prop-types';

const DonutChart = ({
    items,
    centerValue,
    centerLabel = 'Completed',
    size = 180,
    strokeWidth = 24
}) => {
    if (!items || items.length === 0) {
        return (
            <div style={{ height: `${size}px`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b778c', fontSize: '13px' }}>
                No distribution data
            </div>
        );
    }

    const total = items.reduce((acc, curr) => acc + (curr.value || 0), 0);
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    let accumulatedPercentage = 0;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {/* Background circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="transparent"
                        stroke="#ebecf0"
                        strokeWidth={strokeWidth}
                    />

                    {/* Slices */}
                    {total > 0 && items.map((item, idx) => {
                        const val = item.value || 0;
                        const pct = val / total;
                        const strokeDasharray = `${pct * circumference} ${circumference}`;
                        const strokeDashoffset = -accumulatedPercentage * circumference;
                        accumulatedPercentage += pct;

                        return (
                            <circle
                                key={idx}
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                fill="transparent"
                                stroke={item.color || '#0052cc'}
                                strokeWidth={strokeWidth}
                                strokeDasharray={strokeDasharray}
                                strokeDashoffset={strokeDashoffset}
                                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                                style={{ transition: 'stroke-dasharray 0.4s ease' }}
                            />
                        );
                    })}
                </svg>

                {/* Center text */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none'
                }}>
                    <span style={{ fontSize: '22px', fontWeight: '800', color: '#172b4d', lineHeight: '1.1' }}>
                        {centerValue !== undefined ? centerValue : `${total}`}
                    </span>
                    {centerLabel && (
                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#6b778c', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                            {centerLabel}
                        </span>
                    )}
                </div>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {items.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                        <span style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '3px',
                            backgroundColor: item.color || '#0052cc',
                            display: 'inline-block'
                        }} />
                        <span style={{ fontWeight: '500', color: '#172b4d' }}>{item.label}</span>
                        <span style={{ color: '#5e6c84', fontWeight: '700', marginLeft: 'auto' }}>{item.value}</span>
                        {total > 0 && (
                            <span style={{ color: '#8993a4', fontSize: '11px', minWidth: '35px', textAlign: 'right' }}>
                                ({Math.round(((item.value || 0) / total) * 100)}%)
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

DonutChart.propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
        color: PropTypes.string
    })).isRequired,
    centerValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    centerLabel: PropTypes.string,
    size: PropTypes.number,
    strokeWidth: PropTypes.number
};

export default DonutChart;
