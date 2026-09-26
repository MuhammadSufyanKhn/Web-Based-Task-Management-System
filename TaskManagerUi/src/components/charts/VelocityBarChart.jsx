import React, { useState } from 'react';
import PropTypes from 'prop-types';

const VelocityBarChart = ({ sprints, averageVelocity }) => {
    const [hoveredBar, setHoveredBar] = useState(null);

    if (!sprints || sprints.length === 0) {
        return (
            <div style={{
                height: '280px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#fafbfc',
                borderRadius: '8px',
                border: '1px dashed #dfe1e6',
                color: '#6b778c',
                fontSize: '14px'
            }}>
                📈 Complete at least one sprint to track velocity.
            </div>
        );
    }

    const width = 760;
    const height = 300;
    const padding = { top: 25, right: 30, bottom: 45, left: 50 };

    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxPoints = Math.max(
        averageVelocity,
        ...sprints.map(s => Math.max(s.committedStoryPoints || 0, s.completedStoryPoints || 0))
    );
    const maxY = Math.max(10, Math.ceil(maxPoints * 1.15));

    const numSprints = sprints.length;
    const slotWidth = chartWidth / numSprints;
    const barWidth = Math.min(28, slotWidth * 0.32);

    const getY = (val) => {
        const clamped = Math.max(0, val);
        return padding.top + chartHeight - (clamped / maxY) * chartHeight;
    };

    const yTicks = [0, Math.round(maxY * 0.25), Math.round(maxY * 0.5), Math.round(maxY * 0.75), maxY];
    const avgY = getY(averageVelocity);

    return (
        <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
            {/* Legend & Average Velocity indicator */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{
                    backgroundColor: '#fffae6',
                    color: '#974f00',
                    border: '1px solid #ffe380',
                    borderRadius: '4px',
                    padding: '3px 10px',
                    fontSize: '12px',
                    fontWeight: '700'
                }}>
                    ⚡ Average Velocity: {averageVelocity} pts / sprint
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '12px', height: '12px', backgroundColor: '#4c9aff', borderRadius: '2px' }} />
                        <span style={{ color: '#5e6c84', fontWeight: '600' }}>Committed</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '12px', height: '12px', backgroundColor: '#36b37e', borderRadius: '2px' }} />
                        <span style={{ color: '#36b37e', fontWeight: '700' }}>Completed</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '16px', height: '2px', borderTop: '2px dashed #ff8b00' }} />
                        <span style={{ color: '#ff8b00', fontWeight: '600' }}>Average</span>
                    </div>
                </div>
            </div>

            <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
                {/* Y Gridlines */}
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

                {/* Average Velocity Line */}
                {averageVelocity > 0 && (
                    <g>
                        <line
                            x1={padding.left}
                            y1={avgY}
                            x2={padding.left + chartWidth}
                            y2={avgY}
                            stroke="#ff8b00"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                        />
                        <text
                            x={padding.left + chartWidth}
                            y={avgY - 6}
                            textAnchor="end"
                            fontSize="11"
                            fill="#ff8b00"
                            fontWeight="700"
                        >
                            Avg: {averageVelocity}
                        </text>
                    </g>
                )}

                {/* Bars per sprint */}
                {sprints.map((s, idx) => {
                    const slotCenter = padding.left + (idx + 0.5) * slotWidth;
                    const committedX = slotCenter - barWidth - 2;
                    const completedX = slotCenter + 2;

                    const committedY = getY(s.committedStoryPoints || 0);
                    const committedH = Math.max(0, padding.top + chartHeight - committedY);

                    const completedY = getY(s.completedStoryPoints || 0);
                    const completedH = Math.max(0, padding.top + chartHeight - completedY);

                    return (
                        <g key={s.sprintId || idx}>
                            {/* Committed bar */}
                            <rect
                                x={committedX}
                                y={committedY}
                                width={barWidth}
                                height={committedH}
                                fill="#4c9aff"
                                rx="3"
                                style={{ cursor: 'pointer', opacity: hoveredBar && hoveredBar.sprintId === s.sprintId ? 0.85 : 1 }}
                                onMouseEnter={() => setHoveredBar({ ...s, type: 'Committed', points: s.committedStoryPoints, x: committedX + barWidth / 2, y: committedY })}
                                onMouseLeave={() => setHoveredBar(null)}
                            />

                            {/* Completed bar */}
                            <rect
                                x={completedX}
                                y={completedY}
                                width={barWidth}
                                height={completedH}
                                fill="#36b37e"
                                rx="3"
                                style={{ cursor: 'pointer', opacity: hoveredBar && hoveredBar.sprintId === s.sprintId ? 0.85 : 1 }}
                                onMouseEnter={() => setHoveredBar({ ...s, type: 'Completed', points: s.completedStoryPoints, x: completedX + barWidth / 2, y: completedY })}
                                onMouseLeave={() => setHoveredBar(null)}
                            />

                            {/* Sprint Label on X axis */}
                            <text
                                x={slotCenter}
                                y={padding.top + chartHeight + 20}
                                textAnchor="middle"
                                fontSize="12"
                                fill="#172b4d"
                                fontWeight="600"
                            >
                                {s.sprintName.length > 14 ? s.sprintName.substring(0, 12) + '…' : s.sprintName}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Hover Tooltip */}
            {hoveredBar && (
                <div style={{
                    position: 'absolute',
                    top: Math.max(10, (hoveredBar.y / height) * 100 - 15) + '%',
                    left: Math.min(85, Math.max(15, (hoveredBar.x / width) * 100)) + '%',
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
                        {hoveredBar.sprintName} ({hoveredBar.status})
                    </div>
                    <div>Committed: <strong>{hoveredBar.committedStoryPoints || 0} pts</strong></div>
                    <div style={{ color: '#57d9a3' }}>Completed: <strong>{hoveredBar.completedStoryPoints || 0} pts</strong></div>
                    <div style={{ color: '#b3d4ff' }}>Completion: {hoveredBar.completionPercentage || 0}%</div>
                </div>
            )}
        </div>
    );
};

VelocityBarChart.propTypes = {
    sprints: PropTypes.arrayOf(PropTypes.shape({
        sprintId: PropTypes.number,
        sprintName: PropTypes.string,
        status: PropTypes.string,
        committedStoryPoints: PropTypes.number,
        completedStoryPoints: PropTypes.number,
        completionPercentage: PropTypes.number
    })),
    averageVelocity: PropTypes.number
};

export default VelocityBarChart;
