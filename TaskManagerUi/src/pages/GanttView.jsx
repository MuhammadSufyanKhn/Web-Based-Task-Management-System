import React, { useState, useEffect, useMemo } from 'react';
import api from '../Api/Axios';
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
        <div style={{ minHeight: '100%', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
            <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px 20px' }}>
                {/* Page Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.4px' }}>Gantt Chart</h1>
                        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: '3px 0 0 0' }}>Visualize dependencies, task durations, and critical paths</p>
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

                {/* Header Information */}
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
                    boxShadow: '0 2px 10px rgba(48, 92, 222, 0.05)'
                }}>
                    <div>
                        <h2 style={{ margin: '0 0 4px 0', fontSize: '17px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px' }}>
                            Interactive Gantt Chart
                        </h2>
                        <div style={{ fontSize: '13px', color: '#64748b' }}>
                            Task durations, progress completion, and dependency relationships
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', backgroundColor: '#f4f8fe', border: '1px solid #cbdcf7', borderRadius: '6px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#305CDE' }} />
                            <span style={{ color: '#1e293b', fontWeight: '600' }}>In Progress / Todo</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#10b981' }} />
                            <span style={{ color: '#065f46', fontWeight: '600' }}>Completed</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#ef4444' }} />
                            <span style={{ color: '#991b1b', fontWeight: '600' }}>Blocked</span>
                        </div>
                    </div>
                </div>

                {/* Gantt Container */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #cbdcf7' }}>
                        <div style={{ fontSize: '32px', marginBottom: '10px' }}>⚡</div>
                        <div style={{ fontWeight: '600', color: '#0f172a' }}>Loading Gantt schedule...</div>
                    </div>
                ) : (
                    <div style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbdcf7',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 16px rgba(48, 92, 222, 0.06)'
                    }}>
                        {/* Table Header */}
                        <div style={{
                            display: 'flex',
                            borderBottom: '1px solid #cbdcf7',
                            backgroundColor: '#f8fafd',
                            padding: '12px 0'
                        }}>
                            <div style={{ width: '360px', paddingLeft: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#305CDE' }}>
                                Task & Dependencies
                            </div>
                            <div style={{ flex: 1, position: 'relative', height: '18px', paddingLeft: '16px' }}>
                                <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#305CDE' }}>
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
                                            height: '52px',
                                            borderBottom: '1px solid #eef3fc',
                                            backgroundColor: isHighlighted ? '#f4f8fe' : '#ffffff',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.15s ease'
                                        }}
                                    >
                                        {/* Left info column */}
                                        <div style={{
                                            width: '360px',
                                            padding: '0 20px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <strong style={{ color: '#305CDE', fontSize: '12px', fontWeight: '700' }}>{task.issueKey}</strong>
                                                <span style={{
                                                    fontSize: '13px',
                                                    color: '#0f172a',
                                                    fontWeight: '600',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {task.title}
                                                </span>
                                            </div>

                                            {/* Dependency tags */}
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '3px', fontSize: '11px' }}>
                                                {isBlocked && (
                                                    <span style={{ color: '#dc2626', fontWeight: '700' }}>
                                                        ⛔ Blocked by {task.blockedByTaskIds.length} task(s)
                                                    </span>
                                                )}
                                                {task.blocksTaskIds?.length > 0 && (
                                                    <span style={{ color: '#d97706', fontWeight: '600' }}>
                                                        ⚡ Blocks {task.blocksTaskIds.length} task(s)
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right Gantt Bar Chart Column */}
                                        <div style={{
                                            flex: 1,
                                            position: 'relative',
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            backgroundImage: 'repeating-linear-gradient(to right, transparent, transparent 79px, rgba(48, 92, 222, 0.05) 80px)',
                                            borderLeft: '1px solid #eef3fc'
                                        }}>
                                            {/* Today line */}
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    left: `${todayPct}%`,
                                                    top: 0,
                                                    bottom: 0,
                                                    width: '2px',
                                                    backgroundColor: '#305CDE',
                                                    zIndex: 2,
                                                    pointerEvents: 'none'
                                                }}
                                                title="Today"
                                            />

                                            {/* Bar */}
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    left: bar.left,
                                                    width: bar.width,
                                                    height: '28px',
                                                    borderRadius: '6px',
                                                    background: isBlocked
                                                        ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                                                        : isDone
                                                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                                                            : 'linear-gradient(135deg, #305CDE 0%, #4a75f0 100%)',
                                                    border: isBlocked
                                                        ? '1px solid #b91c1c'
                                                        : isDone
                                                            ? '1px solid #047857'
                                                            : '1px solid #2448b8',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '0 10px',
                                                    fontSize: '11px',
                                                    color: '#ffffff',
                                                    fontWeight: '700',
                                                    overflow: 'hidden',
                                                    whiteSpace: 'nowrap',
                                                    boxShadow: isBlocked
                                                        ? '0 2px 8px rgba(239, 68, 68, 0.28)'
                                                        : isDone
                                                            ? '0 2px 8px rgba(16, 185, 129, 0.28)'
                                                            : '0 2px 8px rgba(48, 92, 222, 0.32)',
                                                    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                                                }}
                                            >
                                                <span style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>{task.issueKey}: {task.title}</span>
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


