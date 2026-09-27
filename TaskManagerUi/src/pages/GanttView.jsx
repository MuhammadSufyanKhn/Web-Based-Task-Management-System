import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../Api/Axios';
import TaskDetailModal from '../components/TaskDetailModal';
import CreateIssueModal from '../components/CreateIssueModal';

const GanttView = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [hoveredTask, setHoveredTask] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Filters and controls
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [viewScale, setViewScale] = useState('days'); // 'days' | 'weeks' | 'months'
    const [viewOffsetDays, setViewOffsetDays] = useState(0); // Navigation offset in days

    const scrollContainerRef = useRef(null);

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

    // Filter tasks based on search and status
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const matchesSearch = !searchQuery.trim() ||
                (task.issueKey && task.issueKey.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (task.title && task.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
                (task.userName && task.userName.toLowerCase().includes(searchQuery.toLowerCase()));

            const isBlocked = task.blockedByTaskIds && task.blockedByTaskIds.length > 0;
            let matchesStatus = true;
            if (statusFilter === 'TODO') matchesStatus = task.statusCategory === 'Todo';
            else if (statusFilter === 'IN_PROGRESS') matchesStatus = task.statusCategory === 'InProgress';
            else if (statusFilter === 'DONE') matchesStatus = task.statusCategory === 'Done';
            else if (statusFilter === 'BLOCKED') matchesStatus = isBlocked;

            return matchesSearch && matchesStatus;
        });
    }, [tasks, searchQuery, statusFilter]);

    // Metrics summary
    const metrics = useMemo(() => {
        const total = tasks.length;
        const done = tasks.filter(t => t.statusCategory === 'Done').length;
        const inProgress = tasks.filter(t => t.statusCategory === 'InProgress').length;
        const blocked = tasks.filter(t => t.blockedByTaskIds && t.blockedByTaskIds.length > 0).length;
        const withDependencies = tasks.filter(t => (t.blockedByTaskIds?.length > 0) || (t.blocksTaskIds?.length > 0)).length;
        return { total, done, inProgress, blocked, withDependencies };
    }, [tasks]);

    // Determine Anchor Date (Current date centered, or based on tasks)
    const baseDate = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + viewOffsetDays);
        d.setHours(0, 0, 0, 0);
        return d;
    }, [viewOffsetDays]);

    // Configure timeline span based on view scale
    const { daysList, cellWidth, totalWidth } = useMemo(() => {
        let spanBefore = 14;
        let spanAfter = 35;
        let cWidth = 42; // px per cell

        if (viewScale === 'weeks') {
            spanBefore = 28;
            spanAfter = 70;
            cWidth = 32;
        } else if (viewScale === 'months') {
            spanBefore = 60;
            spanAfter = 150;
            cWidth = 18;
        }

        const days = [];
        const start = new Date(baseDate);
        start.setDate(start.getDate() - spanBefore);

        const totalDays = spanBefore + spanAfter;
        for (let i = 0; i <= totalDays; i++) {
            const cur = new Date(start);
            cur.setDate(start.getDate() + i);
            days.push(cur);
        }

        return {
            daysList: days,
            cellWidth: cWidth,
            totalWidth: days.length * cWidth
        };
    }, [baseDate, viewScale]);

    // Month headers grouping
    const monthGroups = useMemo(() => {
        const groups = [];
        if (daysList.length === 0) return groups;

        let currentMonth = -1;
        let currentGroup = null;

        daysList.forEach((day, index) => {
            const m = day.getMonth();
            const y = day.getFullYear();
            if (m !== currentMonth) {
                if (currentGroup) {
                    currentGroup.width = currentGroup.daysCount * cellWidth;
                    groups.push(currentGroup);
                }
                currentMonth = m;
                currentGroup = {
                    monthName: day.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                    startIndex: index,
                    daysCount: 1,
                    width: cellWidth
                };
            } else {
                currentGroup.daysCount += 1;
            }
        });

        if (currentGroup) {
            currentGroup.width = currentGroup.daysCount * cellWidth;
            groups.push(currentGroup);
        }

        return groups;
    }, [daysList, cellWidth]);

    const timelineStartMs = daysList[0]?.getTime() || 0;

    // Calculate position for a task bar
    const getTaskCoordinates = (task) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        let start = task.createdDate ? new Date(task.createdDate) : new Date(now);
        start.setHours(0, 0, 0, 0);

        let end = task.dueDate ? new Date(task.dueDate) : null;
        if (!end) {
            // Estimate 4 days duration if due date is not specified
            end = new Date(start);
            end.setDate(start.getDate() + 4);
        }
        end.setHours(23, 59, 59, 999);

        // Ensure end is strictly after start
        if (end.getTime() <= start.getTime()) {
            end = new Date(start);
            end.setDate(start.getDate() + 2);
        }

        const startDiffMs = start.getTime() - timelineStartMs;
        const durationMs = end.getTime() - start.getTime();

        const msPerDay = 24 * 60 * 60 * 1000;
        const leftPx = (startDiffMs / msPerDay) * cellWidth;
        const widthPx = Math.max(cellWidth * 0.9, (durationMs / msPerDay) * cellWidth);

        // Calculate progress percentage
        let progress = 0;
        if (task.statusCategory === 'Done') {
            progress = 100;
        } else if (task.subtaskCount > 0) {
            progress = Math.round((task.subtaskCompletedCount / task.subtaskCount) * 100);
        } else if (task.statusCategory === 'InProgress') {
            progress = 60;
        } else {
            progress = 10;
        }

        return {
            leftPx: Math.round(leftPx),
            widthPx: Math.round(widthPx),
            startDate: start,
            endDate: end,
            progress
        };
    };

    // Calculate Today position line
    const todayCoordinates = useMemo(() => {
        const today = new Date();
        today.setHours(12, 0, 0, 0);
        const diffMs = today.getTime() - timelineStartMs;
        const msPerDay = 24 * 60 * 60 * 1000;
        const x = (diffMs / msPerDay) * cellWidth;
        return {
            x: Math.round(x),
            isVisible: x >= 0 && x <= totalWidth
        };
    }, [timelineStartMs, cellWidth, totalWidth]);

    // Handle mouse hover for bar tooltip
    const handleBarMouseEnter = (e, task, coords) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setTooltipPos({
            x: rect.left + rect.width / 2,
            y: rect.top - 8
        });
        setHoveredTask({ task, coords });
    };

    const handleBarMouseLeave = () => {
        setHoveredTask(null);
    };

    const resetToToday = () => {
        setViewOffsetDays(0);
        if (scrollContainerRef.current && todayCoordinates.isVisible) {
            scrollContainerRef.current.scrollLeft = Math.max(0, todayCoordinates.x - 300);
        }
    };

    return (
        <div style={{ minHeight: '100%', backgroundColor: '#f8fafc', color: '#0f172a' }}>
            <div style={{ maxWidth: '1680px', margin: '0 auto', padding: '24px 24px 48px 24px' }}>
                
                {/* ── Top Header ────────────────────────────────────────── */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '20px',
                    flexWrap: 'wrap',
                    gap: '16px'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '8px',
                                backgroundColor: '#1e3a8a',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: '800',
                                fontSize: '16px',
                                boxShadow: '0 2px 8px rgba(30, 58, 138, 0.3)'
                            }}>
                                📊
                            </div>
                            <div>
                                <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
                                    Gantt Chart
                                </h1>
                                <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0 0' }}>
                                    Real-time interactive schedule, dependencies, and critical execution paths
                                </p>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            onClick={fetchTasks}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 14px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                backgroundColor: '#ffffff',
                                color: '#1e3a8a',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                            title="Refresh Gantt"
                        >
                            <span>🔄</span>
                            <span>Refresh</span>
                        </button>

                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '9px 20px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#1e3a8a',
                                color: '#ffffff',
                                fontSize: '13px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(30, 58, 138, 0.25)',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span>
                            <span>Create Issue</span>
                        </button>
                    </div>
                </div>

                {/* ── Summary Metrics Ribbon ────────────────────────────── */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '14px',
                    marginBottom: '20px'
                }}>
                    <div style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '14px 18px',
                        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
                    }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Total Tasks</div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{metrics.total}</div>
                        <div style={{ fontSize: '12px', color: '#1e3a8a', marginTop: '2px', fontWeight: '600' }}>Active in current view</div>
                    </div>

                    <div style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '14px 18px',
                        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
                    }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>In Progress</div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#1e40af', marginTop: '4px' }}>{metrics.inProgress}</div>
                        <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '2px', fontWeight: '600' }}>Actively developing</div>
                    </div>

                    <div style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '14px 18px',
                        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
                    }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Completed</div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: '#15803d', marginTop: '4px' }}>{metrics.done}</div>
                        <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '2px', fontWeight: '600' }}>
                            {metrics.total > 0 ? `${Math.round((metrics.done / metrics.total) * 100)}% completion rate` : '0%'}
                        </div>
                    </div>

                    <div style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '14px 18px',
                        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
                    }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Blocked / Critical</div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: metrics.blocked > 0 ? '#b91c1c' : '#0f172a', marginTop: '4px' }}>{metrics.blocked}</div>
                        <div style={{ fontSize: '12px', color: metrics.blocked > 0 ? '#dc2626' : '#64748b', marginTop: '2px', fontWeight: '600' }}>
                            {metrics.blocked > 0 ? 'Requires attention' : 'No blocked blockers'}
                        </div>
                    </div>
                </div>

                {/* ── Toolbar: Search, Filters, Time Navigation & Scales ── */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    padding: '14px 18px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)'
                }}>
                    {/* Left: Search and Status Filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ position: 'relative', width: '240px' }}>
                            <input
                                type="text"
                                placeholder="Search tasks, keys, assignee..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '7px 12px 7px 32px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '13px',
                                    backgroundColor: '#f8fafc',
                                    color: '#0f172a',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <span style={{ position: 'absolute', left: '10px', top: '8px', color: '#94a3b8', fontSize: '13px' }}>🔍</span>
                        </div>

                        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            {[
                                { id: 'ALL', label: 'All Tasks' },
                                { id: 'IN_PROGRESS', label: 'In Progress' },
                                { id: 'DONE', label: 'Done' },
                                { id: 'BLOCKED', label: 'Blocked' }
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => setStatusFilter(item.id)}
                                    style={{
                                        padding: '5px 12px',
                                        fontSize: '12px',
                                        fontWeight: statusFilter === item.id ? '700' : '500',
                                        color: statusFilter === item.id ? '#ffffff' : '#475569',
                                        backgroundColor: statusFilter === item.id ? '#1e3a8a' : 'transparent',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Date Travel and Scale controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Time navigation */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                                onClick={() => setViewOffsetDays(prev => prev - 14)}
                                style={{
                                    padding: '6px 10px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    backgroundColor: '#ffffff',
                                    color: '#1e3a8a',
                                    cursor: 'pointer',
                                    fontWeight: '700',
                                    fontSize: '12px'
                                }}
                                title="Previous 2 Weeks"
                            >
                                ◀
                            </button>
                            <button
                                onClick={resetToToday}
                                style={{
                                    padding: '6px 14px',
                                    border: '1px solid #1e3a8a',
                                    borderRadius: '6px',
                                    backgroundColor: '#eff6ff',
                                    color: '#1e3a8a',
                                    cursor: 'pointer',
                                    fontWeight: '700',
                                    fontSize: '12px'
                                }}
                            >
                                Today
                            </button>
                            <button
                                onClick={() => setViewOffsetDays(prev => prev + 14)}
                                style={{
                                    padding: '6px 10px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '6px',
                                    backgroundColor: '#ffffff',
                                    color: '#1e3a8a',
                                    cursor: 'pointer',
                                    fontWeight: '700',
                                    fontSize: '12px'
                                }}
                                title="Next 2 Weeks"
                            >
                                ▶
                            </button>
                        </div>

                        {/* View Scale Switcher */}
                        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            {[
                                { id: 'days', label: 'Days' },
                                { id: 'weeks', label: 'Weeks' },
                                { id: 'months', label: 'Months' }
                            ].map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => setViewScale(s.id)}
                                    style={{
                                        padding: '5px 12px',
                                        fontSize: '12px',
                                        fontWeight: viewScale === s.id ? '700' : '500',
                                        color: viewScale === s.id ? '#ffffff' : '#475569',
                                        backgroundColor: viewScale === s.id ? '#1e3a8a' : 'transparent',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        textTransform: 'capitalize',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Main Gantt Chart Diagram Container ────────────────── */}
                {loading ? (
                    <div style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '12px',
                        padding: '100px 20px',
                        textAlign: 'center',
                        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)'
                    }}>
                        <div style={{ fontSize: '36px', marginBottom: '12px' }}>⌛</div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>Rendering Gantt Timeline...</div>
                        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Calculating schedule and dependency graph</div>
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '12px',
                        padding: '80px 20px',
                        textAlign: 'center',
                        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)'
                    }}>
                        <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>No tasks found</div>
                        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Try clearing filters or search query to view issues</div>
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)'
                    }}>
                        {/* ── Left Pane: Task Details Table (Width: 380px) ───── */}
                        <div style={{
                            width: '380px',
                            minWidth: '380px',
                            maxWidth: '380px',
                            borderRight: '2px solid #cbd5e1',
                            backgroundColor: '#ffffff',
                            zIndex: 5,
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            {/* Table Header */}
                            <div style={{
                                height: '64px',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0 16px',
                                backgroundColor: '#0a192f',
                                color: '#ffffff',
                                borderBottom: '1px solid #1e293b'
                            }}>
                                <div style={{ flex: 1, fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#93c5fd' }}>
                                    Task & Dependencies ({filteredTasks.length})
                                </div>
                                <div style={{ width: '80px', textAlign: 'right', fontSize: '11px', fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase' }}>
                                    Status
                                </div>
                            </div>

                            {/* Table Rows */}
                            <div style={{ overflowY: 'hidden' }}>
                                {filteredTasks.map(task => {
                                    const isBlocked = task.blockedByTaskIds && task.blockedByTaskIds.length > 0;
                                    const isDone = task.statusCategory === 'Done';

                                    return (
                                        <div
                                            key={task.taskId}
                                            onClick={() => setSelectedTaskId(task.taskId)}
                                            style={{
                                                height: '52px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '0 16px',
                                                borderBottom: '1px solid #f1f5f9',
                                                cursor: 'pointer',
                                                backgroundColor: '#ffffff',
                                                transition: 'background-color 0.15s ease'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                                        >
                                            <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{
                                                        fontSize: '11px',
                                                        fontWeight: '800',
                                                        color: '#1e3a8a',
                                                        backgroundColor: '#eff6ff',
                                                        padding: '2px 6px',
                                                        borderRadius: '4px',
                                                        border: '1px solid #bfdbfe',
                                                        flexShrink: 0
                                                    }}>
                                                        {task.issueKey}
                                                    </span>
                                                    <span style={{
                                                        fontSize: '13px',
                                                        fontWeight: '600',
                                                        color: '#0f172a',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }} title={task.title}>
                                                        {task.title}
                                                    </span>
                                                </div>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', fontSize: '11px', color: '#64748b' }}>
                                                    <span>👤 {task.userName}</span>
                                                    {isBlocked && (
                                                        <span style={{ color: '#dc2626', fontWeight: '700' }}>
                                                            ⛔ Blocked
                                                        </span>
                                                    )}
                                                    {task.dueDate && (
                                                        <span>📅 {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <div style={{ width: '80px', textAlign: 'right', flexShrink: 0 }}>
                                                <span style={{
                                                    fontSize: '10px',
                                                    fontWeight: '700',
                                                    padding: '3px 8px',
                                                    borderRadius: '12px',
                                                    backgroundColor: isDone ? '#dcfce7' : isBlocked ? '#fee2e2' : '#dbeafe',
                                                    color: isDone ? '#15803d' : isBlocked ? '#991b1b' : '#1e40af',
                                                    border: `1px solid ${isDone ? '#86efac' : isBlocked ? '#fca5a5' : '#93c5fd'}`
                                                }}>
                                                    {task.statusName || (isDone ? 'Done' : 'In Progress')}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── Right Pane: Scrollable Timeline Grid ───────────── */}
                        <div
                            ref={scrollContainerRef}
                            style={{
                                flex: 1,
                                overflowX: 'auto',
                                position: 'relative',
                                backgroundColor: '#ffffff'
                            }}
                        >
                            <div style={{ width: `${totalWidth}px`, position: 'relative' }}>
                                
                                {/* ── Header Row 1: Months ─────────────────────── */}
                                <div style={{
                                    height: '32px',
                                    display: 'flex',
                                    backgroundColor: '#0a192f',
                                    borderBottom: '1px solid #1e293b'
                                }}>
                                    {monthGroups.map((group, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                width: `${group.width}px`,
                                                minWidth: `${group.width}px`,
                                                height: '32px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                paddingLeft: '12px',
                                                fontSize: '12px',
                                                fontWeight: '800',
                                                color: '#ffffff',
                                                borderRight: '1px solid #1e293b',
                                                letterSpacing: '0.4px',
                                                textTransform: 'uppercase'
                                            }}
                                        >
                                            {group.monthName}
                                        </div>
                                    ))}
                                </div>

                                {/* ── Header Row 2: Days / Ticks ───────────────── */}
                                <div style={{
                                    height: '32px',
                                    display: 'flex',
                                    backgroundColor: '#f1f5f9',
                                    borderBottom: '2px solid #cbd5e1'
                                }}>
                                    {daysList.map((day, idx) => {
                                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                                        const isToday = day.toDateString() === new Date().toDateString();
                                        const dayInitial = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][day.getDay()];

                                        return (
                                            <div
                                                key={idx}
                                                style={{
                                                    width: `${cellWidth}px`,
                                                    minWidth: `${cellWidth}px`,
                                                    height: '32px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderRight: '1px solid #e2e8f0',
                                                    backgroundColor: isToday ? '#dbeafe' : isWeekend ? '#f8fafc' : '#ffffff',
                                                    color: isToday ? '#1e3a8a' : isWeekend ? '#94a3b8' : '#334155'
                                                }}
                                            >
                                                <span style={{ fontSize: '10px', fontWeight: isToday ? '800' : '600' }}>
                                                    {day.getDate()}
                                                </span>
                                                {viewScale === 'days' && (
                                                    <span style={{ fontSize: '9px', fontWeight: '500', opacity: 0.8 }}>
                                                        {dayInitial}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* ── Today Vertical Marker Line ────────────────── */}
                                {todayCoordinates.isVisible && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            left: `${todayCoordinates.x}px`,
                                            top: 0,
                                            bottom: 0,
                                            width: '2px',
                                            backgroundColor: '#ef4444',
                                            zIndex: 20,
                                            pointerEvents: 'none'
                                        }}
                                    >
                                        <div style={{
                                            position: 'absolute',
                                            top: '4px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            backgroundColor: '#ef4444',
                                            color: '#ffffff',
                                            fontSize: '9px',
                                            fontWeight: '800',
                                            padding: '2px 5px',
                                            borderRadius: '4px',
                                            whiteSpace: 'nowrap',
                                            boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
                                        }}>
                                            TODAY
                                        </div>
                                    </div>
                                )}

                                {/* ── Task Gantt Bars Rows ───────────────────────── */}
                                <div>
                                    {filteredTasks.map(task => {
                                        const coords = getTaskCoordinates(task);
                                        const isDone = task.statusCategory === 'Done';
                                        const isBlocked = task.blockedByTaskIds && task.blockedByTaskIds.length > 0;

                                        // Bar theme styling
                                        let barBg = 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)';
                                        let barBorder = '#1e3a8a';
                                        let barShadow = 'rgba(30, 64, 175, 0.25)';

                                        if (isDone) {
                                            barBg = 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)';
                                            barBorder = '#166534';
                                            barShadow = 'rgba(22, 163, 74, 0.25)';
                                        } else if (isBlocked) {
                                            barBg = 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)';
                                            barBorder = '#991b1b';
                                            barShadow = 'rgba(220, 38, 38, 0.25)';
                                        }

                                        return (
                                            <div
                                                key={task.taskId}
                                                style={{
                                                    height: '52px',
                                                    position: 'relative',
                                                    borderBottom: '1px solid #f1f5f9',
                                                    backgroundImage: `repeating-linear-gradient(to right, transparent, transparent ${cellWidth - 1}px, #f1f5f9 ${cellWidth}px)`
                                                }}
                                            >
                                                {/* The Gantt Bar */}
                                                <div
                                                    onClick={() => setSelectedTaskId(task.taskId)}
                                                    onMouseEnter={(e) => handleBarMouseEnter(e, task, coords)}
                                                    onMouseLeave={handleBarMouseLeave}
                                                    style={{
                                                        position: 'absolute',
                                                        left: `${coords.leftPx}px`,
                                                        width: `${coords.widthPx}px`,
                                                        top: '10px',
                                                        height: '32px',
                                                        borderRadius: '6px',
                                                        background: barBg,
                                                        border: `1px solid ${barBorder}`,
                                                        boxShadow: `0 2px 8px ${barShadow}`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        padding: '0 10px',
                                                        cursor: 'pointer',
                                                        overflow: 'hidden',
                                                        color: '#ffffff',
                                                        zIndex: 10,
                                                        transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                                                    }}
                                                >
                                                    {/* Inner Progress Indicator */}
                                                    <div style={{
                                                        position: 'absolute',
                                                        left: 0,
                                                        top: 0,
                                                        bottom: 0,
                                                        width: `${coords.progress}%`,
                                                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                                        pointerEvents: 'none'
                                                    }} />

                                                    {/* Bar Label */}
                                                    <span style={{
                                                        fontSize: '11px',
                                                        fontWeight: '700',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        textShadow: '0 1px 2px rgba(0,0,0,0.35)',
                                                        zIndex: 2
                                                    }}>
                                                        {task.issueKey}: {task.title}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Hover Tooltip ────────────────────────────────────────── */}
                {hoveredTask && (
                    <div
                        style={{
                            position: 'fixed',
                            left: `${tooltipPos.x}px`,
                            top: `${tooltipPos.y}px`,
                            transform: 'translate(-50%, -100%)',
                            backgroundColor: '#0a192f',
                            color: '#ffffff',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.35)',
                            border: '1px solid #1e3a8a',
                            fontSize: '12px',
                            pointerEvents: 'none',
                            zIndex: 1000,
                            minWidth: '220px'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <strong style={{ color: '#93c5fd' }}>{hoveredTask.task.issueKey}</strong>
                            <span style={{
                                fontSize: '10px',
                                fontWeight: '700',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: hoveredTask.task.statusCategory === 'Done' ? '#15803d' : '#1e40af'
                            }}>
                                {hoveredTask.task.statusName || 'Active'}
                            </span>
                        </div>
                        <div style={{ fontWeight: '600', marginBottom: '6px' }}>{hoveredTask.task.title}</div>
                        <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.5 }}>
                            <div>📅 Start: {hoveredTask.coords.startDate.toLocaleDateString()}</div>
                            <div>🎯 Due: {hoveredTask.coords.endDate.toLocaleDateString()}</div>
                            <div>👤 Assignee: {hoveredTask.task.userName}</div>
                            <div>📊 Progress: {hoveredTask.coords.progress}%</div>
                            {hoveredTask.task.blockedByTaskIds?.length > 0 && (
                                <div style={{ color: '#f87171', fontWeight: '700', marginTop: '2px' }}>
                                    ⛔ Blocked by {hoveredTask.task.blockedByTaskIds.length} task(s)
                                </div>
                            )}
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
