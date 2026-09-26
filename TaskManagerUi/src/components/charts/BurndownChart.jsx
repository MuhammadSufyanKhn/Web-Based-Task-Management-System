import React, { useState } from 'react';
import PropTypes from 'prop-types';

const BurndownChart = ({ dataPoints, totalStoryPoints }) => {
    const [hoveredPoint, setHoveredPoint] = useState(null);

    if (!dataPoints || dataPoints.length === 0) {
        return (
            <div style={{
                height: '320px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fafbfc',
                borderRadius: '8px',
                border: '1px dashed #dfe1e6',
                color: '#6b778c',
                fontSize: '14px'
            }}>
                📉 No sprint burndown data points available.
            </div>
        );
    }

    const width = 760;
    const height = 320;
    const padding = { top: 20, right: 30, bottom: 45, left: 50 };

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Max story points on Y-axis
    const maxDataY = Math.max(
        totalStoryPoints,
        ...dataPoints.map(d => Math.max(d.IdealRemaining || 0, d.ActualRemaining || 0))
    );
    const maxY = Math.max(10, Math.ceil(maxDataY * 1.1));

    const totalDays = dataPoints.length - 1;
    const getX = (index) => {
        if (totalDays <= 0) return padding.left + chartWidth / 2;
        return padding.left + (index / totalDays) * chartWidth;
    };

    const getY = (val) => {
        const clamped = Math.max(0, val);
        return padding.top + chartHeight - (clamped / maxY) * chartHeight;
    };

    // Build SVG path strings
    const idealPath = dataPoints.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.IdealRemaining)}`).join(' ');
    const actualPath = dataPoints.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.ActualRemaining)}`).join(' ');

    const areaPath = `
        ${actualPath}
        L ${getX(dataPoints.length - 1)} ${padding.top + chartHeight}
        L ${getX(0)} ${padding.top + chartHeight}
        Z
    `;

    // Horizontal Y gridlines (4 steps)
    const yTicks = [0, Math.round(maxY * 0.25), Math.round(maxY * 0.5), Math.round(maxY * 0.75), maxY];

    // X step interval for labels
    const labelStep = Math.max(1, Math.ceil(dataPoints.length / 7));

    return (
        <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
            {/* Legend & Summary */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '20px', marginBottom: '10px', fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '16px', height: '2px', backgroundColor: '#8993a4', borderTop: '2px dashed #8993a4' }} />
                    <span style={{ color: '#5e6c84', fontWeight: '600' }}>Guideline (Ideal)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '14px', height: '4px', backgroundColor: '#0052cc', borderRadius: '2px' }} />
                    <span style={{ color: '#0052cc', fontWeight: '700' }}>Actual Remaining</span>
                </div>
            </div>

            <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
                <defs>
                    <linearGradient id="burndownGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0052cc" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#0052cc" stopOpacity="0.02" />
                    </linearGradient>
                </defs>

                {/* Y Grid Lines & Labels */}
                {yTicks.map((val, idx) => {
                    const y = getY(val);
                    return (
                        <g key={idx}>
                            <line
                                x1={padding.left}
                                y1={y}
                                x2={padding.left + chartWidth}
                                y2={y}
                                stroke="#ebecf0"
                                strokeDasharray={val === 0 ? 'none' : '3,3'}
                            />
                            <text
                                x={padding.left - 8}
                                y={y + 4}
                                textAnchor="end"
                                fontSize="11"
                                fill="#8993a4"
                            >
                                {val} pt
                            </text>
                        </g>
                    );
                })}

                {/* Area under Actual */}
                <path d={areaPath} fill="url(#burndownGrad)" />

                {/* Ideal Guideline */}
                <path
                    d={idealPath}
                    fill="none"
                    stroke="#8993a4"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                />

                {/* Actual Remaining Line */}
                <path
                    d={actualPath}
                    fill="none"
                    stroke="#0052cc"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Data point dots & X Labels */}
                {dataPoints.map((d, i) => {
                    const cx = getX(i);
                    const cy = getY(d.ActualRemaining);
                    const isHovered = hoveredPoint && hoveredPoint.index === i;
                    const showLabel = i === 0 || i === dataPoints.length - 1 || i % labelStep === 0;

                    return (
                        <g key={i}>
                            {/* X Axis Label */}
                            {showLabel && (
                                <text
                                    x={cx}
                                    y={padding.top + chartHeight + 20}
                                    textAnchor="middle"
                                    fontSize="11"
                                    fill="#6b778c"
                                    fontWeight="500"
                                >
                                    {d.DisplayLabel?.includes('(') ? d.DisplayLabel.split('(')[0].trim() : (d.DisplayLabel || `Day ${i}`)}
                                </text>
                            )}

                            {/* Dot */}
                            <circle
                                cx={cx}
                                cy={cy}
                                r={isHovered ? 6 : 4}
                                fill="#ffffff"
                                stroke="#0052cc"
                                strokeWidth={isHovered ? 3 : 2}
                                style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                                onMouseEnter={() => setHoveredPoint({ ...d, index: i, cx, cy })}
                                onMouseLeave={() => setHoveredPoint(null)}
                            />
                        </g>
                    );
                })}
            </svg>

            {/* Hover Tooltip */}
            {hoveredPoint && (
                <div style={{
                    position: 'absolute',
                    top: Math.max(10, (hoveredPoint.cy / height) * 100 - 15) + '%',
                    left: Math.min(85, Math.max(15, (hoveredPoint.cx / width) * 100)) + '%',
                    transform: 'translate(-50%, -100%)',
                    backgroundColor: '#172b4d',
                    color: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                    pointerEvents: 'none',
                    zIndex: 20,
                    whiteSpace: 'nowrap'
                }}>
                    <div style={{ fontWeight: '700', marginBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '3px' }}>
                        {hoveredPoint.DisplayLabel || hoveredPoint.Date}
                    </div>
                    <div>Remaining: <strong>{hoveredPoint.ActualRemaining} pts</strong></div>
                    <div style={{ color: '#dfe1e6' }}>Ideal: {hoveredPoint.IdealRemaining} pts</div>
                    {hoveredPoint.CompletedOnThisDay > 0 && (
                        <div style={{ color: '#36b37e', marginTop: '2px', fontWeight: '600' }}>
                            Burned: -{hoveredPoint.CompletedOnThisDay} pts
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

BurndownChart.propTypes = {
    dataPoints: PropTypes.arrayOf(PropTypes.shape({
        Date: PropTypes.string,
        DisplayLabel: PropTypes.string,
        IdealRemaining: PropTypes.number,
        ActualRemaining: PropTypes.number,
        CompletedOnThisDay: PropTypes.number
    })),
    totalStoryPoints: PropTypes.number
};

export default BurndownChart;
