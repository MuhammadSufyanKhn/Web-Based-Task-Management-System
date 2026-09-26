import React, { useState, useEffect, useMemo } from 'react';
import api from '../Api/Axios';
import TaskDetailModal from '../components/TaskDetailModal';
import CreateIssueModal from '../components/CreateIssueModal';

const TimelineView = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [groupBy, setGroupBy] = useState('sprint'); // 'sprint', 'epic', 'assignee'
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const res = await api.get('/kanban/views/all-tasks');
            setTasks(res.data || []);
        } catch (err) {
            console.error('Failed to load tasks for Timeline View', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    // Determine timeline date bounds (spanning roughly 30 days before and 60 days ahead)
    const { timelineStart, timelineEnd, totalDays } = useMemo(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 2, 28);
        const diffTime = Math.abs(end - start);
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return { timelineStart: start, timelineEnd: end, totalDays: days };
    }, []);

    // Generate week header marks
    const timelineHeaders = useMemo(() => {
        const marks = [];
        const curr = new Date(timelineStart);
        while (curr <= timelineEnd) {
            marks.push(new Date(curr));
            curr.setDate(curr.getDate() + 7);
        }
        return marks;
    }, [timelineStart, timelineEnd]);

    // Position helper
    const getBarStyles = (task) => {
        const start = task.createdDate ? new Date(task.createdDate) : new Date();
        const due = task.dueDate ? new Date(task.dueDate) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

        const clampedStart = Math.max(start.getTime(), timelineStart.getTime());
        const clampedDue = Math.max(clampedStart + 24 * 60 * 60 * 1000, Math.min(due.getTime(), timelineEnd.getTime()));

        const leftPct = ((clampedStart - timelineStart.getTime()) / (timelineEnd.getTime() - timelineStart.getTime())) * 100;
        const widthPct = Math.max(2, ((clampedDue - clampedStart) / (timelineEnd.getTime() - timelineStart.getTime())) * 100);

        return {
            left: `${Math.max(0, Math.min(98, leftPct))}%`,
            width: `${Math.min(100 - leftPct, Math.max(2.5, widthPct))}%`
        };
    };

    // Calculate current day marker percentage
    const todayPct = useMemo(() => {
        const now = new Date().getTime();
        const start = timelineStart.getTime();
        const end = timelineEnd.getTime();
        return Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
    }, [timelineStart, timelineEnd]);

    // Group tasks
    const groupedData = useMemo(() => {
        const groups = {};

        tasks.forEach(t => {
            let key = 'Unassigned';
            let title = 'Unassigned';

            if (groupBy === 'sprint') {
                key = t.sprintName || 'Backlog';
                title = t.sprintName || 'Backlog (No Sprint)';
            } else if (groupBy === 'epic') {
                key = t.epicName || 'No Epic';
                title = t.epicName || 'No Epic Assigned';
            } else if (groupBy === 'assignee') {
                key = t.userName || 'Unassigned';
                title = t.userName || 'Unassigned Tasks';
            }

            if (!groups[key]) {
                groups[key] = {
                    title,
                    tasks: []
                };
            }
            groups[key].tasks.push(t);
        });

        return Object.entries(groups);
    }, [tasks, groupBy]);

    return (
        <div style={{ minHeight: '100%', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
            <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px 20px' }}>
                {/* Page Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.4px' }}>Timeline</h1>
                        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: '3px 0 0 0' }}>Visualize issue schedules, milestones, and sprint roadmaps</p>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="btn btn-primary"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 18px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        <span>+</span>
                        <span>Create Issue</span>
                    </button>
                </div>

                {/* Toolbar */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '14px',
                    marginBottom: '20px',
                    padding: '16px 20px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbdcf7',
                    borderRadius: '12px',
                    boxShadow: '0 4px 16px -4px rgba(48, 92, 222, 0.08)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px' }}>
                            Roadmap & Timeline
                        </h2>
                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                            (Weekly Scale)
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '13px', color: '#475569', fontWeight: '600' }}>Group by:</span>
                        <div style={{
                            display: 'flex',
                            backgroundColor: '#f1f5fd',
                            padding: '4px',
                            borderRadius: '10px',
                            border: '1px solid #cbdcf7'
                        }}>
                            {['sprint', 'epic', 'assignee'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setGroupBy(type)}
                                    style={{
                                        padding: '6px 14px',
                                        borderRadius: '7px',
                                        border: 'none',
                                        fontSize: '12px',
                                        fontWeight: groupBy === type ? '700' : '600',
                                        color: groupBy === type ? '#ffffff' : '#475569',
                                        backgroundColor: groupBy === type ? '#305CDE' : 'transparent',
                                        cursor: 'pointer',
                                        textTransform: 'capitalize',
                                        boxShadow: groupBy === type ? '0 2px 6px rgba(48, 92, 222, 0.35)' : 'none',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Timeline Visualization Container */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚡</div>
                        <div>Loading timeline roadmap...</div>
                    </div>
                ) : (
                    <div style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbdcf7',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 20px -4px rgba(48, 92, 222, 0.08)'
                    }}>
                        {/* Timeline Header scale */}
                        <div style={{
                            display: 'flex',
                            borderBottom: '1px solid #cbdcf7',
                            backgroundColor: '#f8fafd',
                            padding: '12px 0',
                            position: 'relative'
                        }}>
                            {/* Left label space */}
                            <div style={{ width: '220px', paddingLeft: '20px', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', color: '#305CDE', letterSpacing: '0.6px' }}>
                                Group / Issue
                            </div>

                            {/* Date ticks */}
                            <div style={{ flex: 1, position: 'relative', height: '24px' }}>
                                {timelineHeaders.map((date, idx) => {
                                    const leftPct = ((date.getTime() - timelineStart.getTime()) / (timelineEnd.getTime() - timelineStart.getTime())) * 100;
                                    return (
                                        <div
                                            key={idx}
                                            style={{
                                                position: 'absolute',
                                                left: `${leftPct}%`,
                                                transform: 'translateX(-50%)',
                                                fontSize: '11px',
                                                color: '#305CDE',
                                                fontWeight: '600',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </div>
                                    );
                                })}

                                {/* Today line indicator */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: `${todayPct}%`,
                                        top: '0',
                                        bottom: '-9999px',
                                        width: '2px',
                                        backgroundColor: '#ef4444',
                                        zIndex: 10,
                                        pointerEvents: 'none'
                                    }}
                                    title="Today"
                                />
                            </div>
                        </div>

                        {/* Groups and task rows */}
                        <div style={{ maxHeight: '720px', overflowY: 'auto' }}>
                            {groupedData.map(([groupKey, group]) => {
                                return (
                                    <div key={groupKey} style={{ borderBottom: '1px solid #eef3fc' }}>
                                        {/* Group Header Banner */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '10px 20px',
                                            backgroundColor: '#f4f8fe',
                                            borderBottom: '1px solid #e2edfb',
                                            fontSize: '13px',
                                            fontWeight: '700',
                                            color: '#1e3a8a'
                                        }}>
                                            <span>📁 {group.title}</span>
                                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                                                {group.tasks.length} {group.tasks.length === 1 ? 'issue' : 'issues'}
                                            </span>
                                        </div>

                                        {/* Task Bars */}
                                        <div style={{ padding: '6px 0' }}>
                                            {group.tasks.map(task => {
                                                const barStyle = getBarStyles(task);
                                                const isDone = task.statusCategory === 'Done';

                                                return (
                                                    <div
                                                        key={task.taskId}
                                                        onClick={() => setSelectedTaskId(task.taskId)}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            height: '40px',
                                                            padding: '0 20px',
                                                            cursor: 'pointer',
                                                            position: 'relative',
                                                            borderBottom: '1px solid #f8fafc',
                                                            transition: 'background-color 0.15s ease'
                                                        }}
                                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafd'}
                                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    >
                                                        {/* Left title info */}
                                                        <div style={{
                                                            width: '200px',
                                                            paddingRight: '16px',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                            fontSize: '12px'
                                                        }}>
                                                            <strong style={{ color: '#305CDE', marginRight: '6px' }}>
                                                                {task.issueKey}
                                                            </strong>
                                                            <span style={{ color: '#0f172a', fontWeight: '500' }}>{task.title}</span>
                                                        </div>

                                                        {/* Bar Chart Area */}
                                                        <div style={{ flex: 1, position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
                                                            <div
                                                                style={{
                                                                    position: 'absolute',
                                                                    left: barStyle.left,
                                                                    width: barStyle.width,
                                                                    height: '24px',
                                                                    borderRadius: '6px',
                                                                    backgroundColor: isDone ? '#dcfce7' : '#eef3fd',
                                                                    border: isDone ? '1px solid #86efac' : '1px solid #305CDE',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    padding: '0 8px',
                                                                    fontSize: '11px',
                                                                    fontWeight: '700',
                                                                    color: isDone ? '#15803d' : '#1e3a8a',
                                                                    boxShadow: '0 2px 6px rgba(48, 92, 222, 0.12)',
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                    transition: 'all 0.15s ease'
                                                                }}
                                                            >
                                                                <span style={{
                                                                    width: '6px',
                                                                    height: '6px',
                                                                    borderRadius: '50%',
                                                                    backgroundColor: isDone ? '#16a34a' : (task.statusColor || '#305CDE'),
                                                                    marginRight: '6px',
                                                                    flexShrink: 0
                                                                }} />
                                                                <span>{task.title}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Task Detail Modal */}
            {selectedTaskId && (
                <TaskDetailModal
                    taskId={selectedTaskId}
                    onClose={() => {
                        setSelectedTaskId(null);
                        fetchTasks();
                    }}
                    onTaskUpdated={fetchTasks}
                />
            )}

            {/* Create Issue Modal */}
            {isCreateModalOpen && (
                <CreateIssueModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onCreated={() => {
                        setIsCreateModalOpen(false);
                        fetchTasks();
                    }}
                />
            )}
        </div>
    );
};

export default TimelineView;


