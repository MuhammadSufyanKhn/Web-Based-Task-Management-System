import React, { useState, useEffect, useMemo } from 'react';
import api from '../Api/Axios';
import AppNavbar from '../components/AppNavbar';
import ViewSwitcher from '../components/ViewSwitcher';
import TaskDetailModal from '../components/TaskDetailModal';
import CreateIssueModal from '../components/CreateIssueModal';

const GanttView = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [highlightedTaskId, setHighlightedTaskId] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const res = await api.get('/kanban/views/all-tasks');
            setTasks(res.data || []);
        } catch (err) {
            console.error('Failed to load tasks for Gantt View', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    // Timeline Boundaries
    const { timelineStart, timelineEnd } = useMemo(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
        return { timelineStart: start, timelineEnd: end };
    }, []);

    // Days column ticks
    const daysHeader = useMemo(() => {
        const days = [];
        const curr = new Date(timelineStart);
        while (curr <= timelineEnd) {
            days.push(new Date(curr));
            curr.setDate(curr.getDate() + 1);
        }
        return days;
    }, [timelineStart, timelineEnd]);

    // Position calculator for Gantt Bar
    const getGanttBarStyle = (task) => {
        const created = task.createdDate ? new Date(task.createdDate) : new Date();
        const due = task.dueDate ? new Date(task.dueDate) : new Date(created.getTime() + 5 * 24 * 60 * 60 * 1000);

        const startTime = Math.max(created.getTime(), timelineStart.getTime());
        const dueTime = Math.max(startTime + 24 * 60 * 60 * 1000, Math.min(due.getTime(), timelineEnd.getTime()));

        const totalMs = timelineEnd.getTime() - timelineStart.getTime();
        const leftPct = ((startTime - timelineStart.getTime()) / totalMs) * 100;
        const widthPct = Math.max(1.5, ((dueTime - startTime) / totalMs) * 100);

        return {
            left: `${Math.max(0, Math.min(98, leftPct))}%`,
            width: `${Math.min(100 - leftPct, Math.max(2, widthPct))}%`
        };
    };

    // Today indicator
    const todayPct = useMemo(() => {
        const now = new Date().getTime();
        const start = timelineStart.getTime();
        const end = timelineEnd.getTime();
        return Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
    }, [timelineStart, timelineEnd]);

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

                {/* Header Information */}
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
                    <div>
                        <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
                            Interactive Gantt Chart
                        </h2>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                            Task durations, progress completion, and dependency relationships
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#3b82f6' }} />
                            <span style={{ color: '#cbd5e1' }}>In Progress / Todo</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#10b981' }} />
                            <span style={{ color: '#cbd5e1' }}>Completed</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#ef4444' }} />
                            <span style={{ color: '#cbd5e1' }}>Blocked</span>
                        </div>
                    </div>
                </div>

                {/* Gantt Container */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚡</div>
                        <div>Loading Gantt schedule...</div>
                    </div>
                ) : (
                    <div style={{
                        backgroundColor: '#0f172a',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        overflow: 'hidden'
                    }}>
                        {/* Table Header */}
                        <div style={{
                            display: 'flex',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            backgroundColor: 'rgba(0, 0, 0, 0.25)',
                            padding: '10px 0'
                        }}>
                            <div style={{ width: '340px', paddingLeft: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8' }}>
                                Task & Dependencies
                            </div>
                            <div style={{ flex: 1, position: 'relative', height: '20px' }}>
                                <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#94a3b8' }}>
                                    Schedule & Dependencies View
                                </div>
                            </div>
                        </div>

                        {/* Tasks List */}
                        <div style={{ maxHeight: '720px', overflowY: 'auto' }}>
                            {tasks.map(task => {
                                const bar = getGanttBarStyle(task);
                                const isDone = task.statusCategory === 'Done';
                                const isBlocked = task.blockedByTaskIds?.length > 0;
                                const isHighlighted = highlightedTaskId === task.taskId;

                                return (
                                    <div
                                        key={task.taskId}
                                        onClick={() => setSelectedTaskId(task.taskId)}
                                        onMouseEnter={() => setHighlightedTaskId(task.taskId)}
                                        onMouseLeave={() => setHighlightedTaskId(null)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            height: '46px',
                                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                                            backgroundColor: isHighlighted ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.15s'
                                        }}
                                    >
                                        {/* Left info column */}
                                        <div style={{
                                            width: '340px',
                                            padding: '0 20px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <strong style={{ color: '#60a5fa', fontSize: '12px' }}>{task.issueKey}</strong>
                                                <span style={{
                                                    fontSize: '12px',
                                                    color: '#ffffff',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {task.title}
                                                </span>
                                            </div>

                                            {/* Dependency tags */}
                                            <div style={{ display: 'flex', gap: '6px', marginTop: '2px', fontSize: '10px' }}>
                                                {isBlocked && (
                                                    <span style={{ color: '#f87171', fontWeight: '600' }}>
                                                        ⛔ Blocked by {task.blockedByTaskIds.length} task(s)
                                                    </span>
                                                )}
                                                {task.blocksTaskIds?.length > 0 && (
                                                    <span style={{ color: '#fbbf24', fontWeight: '500' }}>
                                                        ⚡ Blocks {task.blocksTaskIds.length} task(s)
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right Gantt Bar Chart Column */}
                                        <div style={{ flex: 1, position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
                                            {/* Today line */}
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    left: `${todayPct}%`,
                                                    top: 0,
                                                    bottom: 0,
                                                    width: '1px',
                                                    backgroundColor: 'rgba(239, 68, 68, 0.4)',
                                                    pointerEvents: 'none'
                                                }}
                                            />

                                            {/* Bar */}
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    left: bar.left,
                                                    width: bar.width,
                                                    height: '24px',
                                                    borderRadius: '6px',
                                                    backgroundColor: isBlocked
                                                        ? 'rgba(239, 68, 68, 0.25)'
                                                        : isDone
                                                            ? 'rgba(16, 185, 129, 0.25)'
                                                            : 'rgba(59, 130, 246, 0.25)',
                                                    border: isBlocked
                                                        ? '1px solid #ef4444'
                                                        : isDone
                                                            ? '1px solid #10b981'
                                                            : '1px solid #3b82f6',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '0 8px',
                                                    fontSize: '11px',
                                                    color: '#ffffff',
                                                    fontWeight: '600',
                                                    overflow: 'hidden',
                                                    whiteSpace: 'nowrap',
                                                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                                                }}
                                            >
                                                <span>{task.issueKey}: {task.title}</span>
                                            </div>
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

export default GanttView;
