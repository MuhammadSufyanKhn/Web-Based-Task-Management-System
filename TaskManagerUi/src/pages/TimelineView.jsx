import React, { useState, useEffect, useMemo } from 'react';
import api from '../Api/Axios';
import AppNavbar from '../components/AppNavbar';
import ViewSwitcher from '../components/ViewSwitcher';
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
        <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f8fafc' }}>
            <AppNavbar />

            <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px 20px' }}>
                <ViewSwitcher
                    rightContent={
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                backgroundColor: '#3b82f6',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                            }}
                        >
                            <span>+</span>
                            <span>Create Issue</span>
                        </button>
                    }
                />

                {/* Toolbar */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '14px',
                    marginBottom: '20px',
                    padding: '16px',
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
                            Roadmap & Timeline
                        </h2>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                            (Weekly Scale)
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '13px', color: '#94a3b8' }}>Group by:</span>
                        <div style={{
                            display: 'flex',
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            padding: '3px',
                            borderRadius: '8px'
                        }}>
                            {['sprint', 'epic', 'assignee'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setGroupBy(type)}
                                    style={{
                                        padding: '5px 12px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        fontSize: '12px',
                                        fontWeight: groupBy === type ? '600' : '500',
                                        color: groupBy === type ? '#ffffff' : '#94a3b8',
                                        backgroundColor: groupBy === type ? '#3b82f6' : 'transparent',
                                        cursor: 'pointer',
                                        textTransform: 'capitalize'
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
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚡</div>
                        <div>Loading timeline roadmap...</div>
                    </div>
                ) : (
                    <div style={{
                        backgroundColor: '#0f172a',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        overflow: 'hidden'
                    }}>
                        {/* Timeline Header scale */}
                        <div style={{
                            display: 'flex',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            padding: '12px 0',
                            position: 'relative'
                        }}>
                            {/* Left label space */}
                            <div style={{ width: '220px', paddingLeft: '20px', fontWeight: '600', fontSize: '12px', color: '#94a3b8' }}>
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
                                                color: '#64748b',
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
                                    <div key={groupKey} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                                        {/* Group Header Banner */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '10px 20px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                            fontSize: '13px',
                                            fontWeight: '700',
                                            color: '#60a5fa'
                                        }}>
                                            <span>📁 {group.title}</span>
                                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
                                                {group.tasks.length} {group.tasks.length === 1 ? 'issue' : 'issues'}
                                            </span>
                                        </div>

                                        {/* Task Bars */}
                                        <div style={{ padding: '8px 0' }}>
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
                                                            height: '38px',
                                                            padding: '0 20px',
                                                            cursor: 'pointer',
                                                            position: 'relative',
                                                            transition: 'background-color 0.15s'
                                                        }}
                                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'}
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
                                                            <strong style={{ color: '#93c5fd', marginRight: '6px' }}>
                                                                {task.issueKey}
                                                            </strong>
                                                            <span style={{ color: '#cbd5e1' }}>{task.title}</span>
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
                                                                    backgroundColor: isDone ? 'rgba(16, 185, 129, 0.25)' : 'rgba(59, 130, 246, 0.25)',
                                                                    border: isDone ? '1px solid #10b981' : '1px solid #3b82f6',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    padding: '0 8px',
                                                                    fontSize: '11px',
                                                                    fontWeight: '600',
                                                                    color: '#ffffff',
                                                                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis'
                                                                }}
                                                            >
                                                                <span style={{
                                                                    width: '6px',
                                                                    height: '6px',
                                                                    borderRadius: '50%',
                                                                    backgroundColor: isDone ? '#10b981' : (task.statusColor || '#3b82f6'),
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
