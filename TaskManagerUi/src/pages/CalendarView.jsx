import React, { useState, useEffect, useMemo } from 'react';
import api from '../Api/Axios';
import TaskDetailModal from '../components/TaskDetailModal';
import CreateIssueModal from '../components/CreateIssueModal';

const CalendarView = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());

    // Filters
    const [sprintFilter, setSprintFilter] = useState('All');
    const [assigneeFilter, setAssigneeFilter] = useState('All');
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createDefaultDate, setCreateDefaultDate] = useState(null);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const res = await api.get('/kanban/views/all-tasks');
            setTasks(res.data || []);
        } catch (err) {
            console.error('Failed to load tasks for Calendar View', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    // Calendar Calculations
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Filter choices
    const sprints = useMemo(() => {
        const set = new Set();
        tasks.forEach(t => { if (t.sprintName) set.add(t.sprintName); });
        return Array.from(set);
    }, [tasks]);

    const assignees = useMemo(() => {
        const map = new Map();
        tasks.forEach(t => { if (t.userId && t.userName) map.set(t.userId, t.userName); });
        return Array.from(map.entries());
    }, [tasks]);

    // Tasks filtered
    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            if (sprintFilter !== 'All' && t.sprintName !== sprintFilter) return false;
            if (assigneeFilter !== 'All' && t.userId?.toString() !== assigneeFilter) return false;
            return true;
        });
    }, [tasks, sprintFilter, assigneeFilter]);

    // Map tasks by date YYYY-MM-DD
    const tasksByDate = useMemo(() => {
        const map = {};
        filteredTasks.forEach(t => {
            const dateStr = t.dueDate ? t.dueDate.split('T')[0] : (t.createdDate ? t.createdDate.split('T')[0] : null);
            if (dateStr) {
                if (!map[dateStr]) map[dateStr] = [];
                map[dateStr].push(t);
            }
        });
        return map;
    }, [filteredTasks]);

    // Grid days builder
    const calendarDays = useMemo(() => {
        const days = [];

        // Previous month filler days
        for (let i = firstDayIndex - 1; i >= 0; i--) {
            const d = daysInPrevMonth - i;
            const dateStr = `${month === 0 ? year - 1 : year}-${String(month === 0 ? 12 : month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            days.push({
                dayNumber: d,
                dateStr,
                isCurrentMonth: false
            });
        }

        // Current month days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            days.push({
                dayNumber: d,
                dateStr,
                isCurrentMonth: true
            });
        }

        // Next month filler days to complete 35 or 42 grid cells
        const totalSlots = Math.ceil(days.length / 7) * 7;
        let nextDay = 1;
        while (days.length < totalSlots) {
            const dateStr = `${month === 11 ? year + 1 : year}-${String(month === 11 ? 1 : month + 2).padStart(2, '0')}-${String(nextDay).padStart(2, '0')}`;
            days.push({
                dayNumber: nextDay,
                dateStr,
                isCurrentMonth: false
            });
            nextDay++;
        }

        return days;
    }, [year, month, firstDayIndex, daysInMonth, daysInPrevMonth]);

    const todayStr = new Date().toISOString().split('T')[0];

    const handleDayClick = (dateStr) => {
        setCreateDefaultDate(dateStr);
        setIsCreateModalOpen(true);
    };

    return (
        <div style={{ minHeight: '100%', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
            <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px 20px' }}>
                {/* Page Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.4px' }}>Calendar</h1>
                        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: '3px 0 0 0' }}>Plan, schedule, and track issue due dates month by month</p>
                    </div>
                    <button
                        onClick={() => {
                            setCreateDefaultDate(null);
                            setIsCreateModalOpen(true);
                        }}
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

                {/* Navigation and Filters Bar */}
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
                    {/* Month Navigator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.3px' }}>
                            {monthNames[month]} {year}
                        </h2>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                                onClick={prevMonth}
                                aria-label="Previous month"
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    backgroundColor: '#f8fafd',
                                    color: '#305CDE',
                                    border: '1px solid #cbdcf7',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '700',
                                    transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#eef3fd'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafd'; }}
                            >
                                ◀
                            </button>
                            <button
                                onClick={goToToday}
                                style={{
                                    padding: '6px 16px',
                                    borderRadius: '8px',
                                    backgroundColor: '#eef3fd',
                                    color: '#305CDE',
                                    border: '1px solid #c3d4f8',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#305CDE'; e.currentTarget.style.color = '#ffffff'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#eef3fd'; e.currentTarget.style.color = '#305CDE'; }}
                            >
                                Today
                            </button>
                            <button
                                onClick={nextMonth}
                                aria-label="Next month"
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    backgroundColor: '#f8fafd',
                                    color: '#305CDE',
                                    border: '1px solid #cbdcf7',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '700',
                                    transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#eef3fd'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafd'; }}
                            >
                                ▶
                            </button>
                        </div>
                    </div>

                    {/* Filter Choices */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <select
                            value={sprintFilter}
                            onChange={(e) => setSprintFilter(e.target.value)}
                            style={{
                                padding: '8px 14px',
                                borderRadius: '8px',
                                backgroundColor: '#ffffff',
                                border: '1px solid #cbdcf7',
                                color: '#1e293b',
                                fontSize: '13px',
                                fontWeight: '600',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="All">All Sprints</option>
                            {sprints.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>

                        <select
                            value={assigneeFilter}
                            onChange={(e) => setAssigneeFilter(e.target.value)}
                            style={{
                                padding: '8px 14px',
                                borderRadius: '8px',
                                backgroundColor: '#ffffff',
                                border: '1px solid #cbdcf7',
                                color: '#1e293b',
                                fontSize: '13px',
                                fontWeight: '600',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="All">All Assignees</option>
                            {assignees.map(([id, name]) => (
                                <option key={id} value={id.toString()}>{name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbdcf7',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 20px -4px rgba(48, 92, 222, 0.08)'
                }}>
                    {/* Weekday headers */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        borderBottom: '1px solid #e2edfb',
                        backgroundColor: '#f8fafd',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#305CDE',
                        letterSpacing: '0.6px',
                        textTransform: 'uppercase',
                        padding: '12px 0'
                    }}>
                        {daysOfWeek.map(day => (
                            <div key={day}>{day}</div>
                        ))}
                    </div>

                    {/* Day Cells */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        minHeight: '680px'
                    }}>
                        {calendarDays.map((cell, idx) => {
                            const dayTasks = tasksByDate[cell.dateStr] || [];
                            const isToday = cell.dateStr === todayStr;

                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleDayClick(cell.dateStr)}
                                    style={{
                                        minHeight: '120px',
                                        padding: '10px 8px',
                                        borderRight: (idx + 1) % 7 !== 0 ? '1px solid #eef3fc' : 'none',
                                        borderBottom: '1px solid #eef3fc',
                                        backgroundColor: !cell.isCurrentMonth
                                            ? '#f8fafd'
                                            : isToday
                                                ? '#eef4fd'
                                                : '#ffffff',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.15s ease'
                                    }}
                                    onMouseOver={(e) => {
                                        if (cell.isCurrentMonth && !isToday) {
                                            e.currentTarget.style.backgroundColor = '#f4f8fe';
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        if (cell.isCurrentMonth && !isToday) {
                                            e.currentTarget.style.backgroundColor = '#ffffff';
                                        }
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span style={{
                                            fontSize: '12px',
                                            fontWeight: isToday ? '800' : '600',
                                            color: isToday
                                                ? '#ffffff'
                                                : cell.isCurrentMonth ? '#1e293b' : '#94a3b8',
                                            backgroundColor: isToday ? '#305CDE' : 'transparent',
                                            padding: isToday ? '3px 8px' : '0',
                                            borderRadius: isToday ? '12px' : '0',
                                            boxShadow: isToday ? '0 2px 6px rgba(48, 92, 222, 0.35)' : 'none'
                                        }}>
                                            {cell.dayNumber}
                                        </span>

                                        {dayTasks.length > 0 && (
                                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
                                                {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Task Chips */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {dayTasks.slice(0, 4).map(task => {
                                            const isOverdue = task.dueDate && task.dueDate < todayStr && task.statusCategory !== 'Done';
                                            return (
                                                <div
                                                    key={task.taskId}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedTaskId(task.taskId);
                                                    }}
                                                    style={{
                                                        padding: '5px 8px',
                                                        borderRadius: '6px',
                                                        backgroundColor: isOverdue ? '#fef2f2' : '#ffffff',
                                                        border: isOverdue ? '1px solid #fecaca' : '1px solid #cbdcf7',
                                                        borderLeft: `3px solid ${task.statusColor || '#305CDE'}`,
                                                        fontSize: '11px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        gap: '4px',
                                                        cursor: 'pointer',
                                                        overflow: 'hidden',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                                                        transition: 'all 0.15s ease'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.borderColor = '#305CDE';
                                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                                        e.currentTarget.style.boxShadow = '0 3px 8px rgba(48, 92, 222, 0.15)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.borderColor = isOverdue ? '#fecaca' : '#cbdcf7';
                                                        e.currentTarget.style.transform = 'none';
                                                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)';
                                                    }}
                                                    title={`${task.issueKey}: ${task.title} (${task.statusName})`}
                                                >
                                                    <span style={{
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        fontWeight: '600',
                                                        color: isOverdue ? '#991b1b' : '#0f172a'
                                                    }}>
                                                        <span style={{ color: '#305CDE', marginRight: '4px' }}>{task.issueKey}</span>
                                                        {task.title}
                                                    </span>

                                                    <span style={{
                                                        width: '6px',
                                                        height: '6px',
                                                        borderRadius: '50%',
                                                        backgroundColor: task.statusColor || '#305CDE',
                                                        flexShrink: 0
                                                    }} />
                                                </div>
                                            );
                                        })}

                                        {dayTasks.length > 4 && (
                                            <div style={{ fontSize: '11px', color: '#305CDE', textAlign: 'center', marginTop: '2px', fontWeight: '700' }}>
                                                +{dayTasks.length - 4} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
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
                    initialDueDate={createDefaultDate}
                    onClose={() => {
                        setIsCreateModalOpen(false);
                        setCreateDefaultDate(null);
                    }}
                    onCreated={() => {
                        setIsCreateModalOpen(false);
                        setCreateDefaultDate(null);
                        fetchTasks();
                    }}
                />
            )}
        </div>
    );
};

export default CalendarView;


