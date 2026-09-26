import React, { useState, useEffect, useMemo } from 'react';
import api from '../Api/Axios';
import AppNavbar from '../components/AppNavbar';
import ViewSwitcher from '../components/ViewSwitcher';
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
        <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f8fafc' }}>
            <AppNavbar />

            <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px 20px' }}>
                <ViewSwitcher
                    rightContent={
                        <button
                            onClick={() => {
                                setCreateDefaultDate(null);
                                setIsCreateModalOpen(true);
                            }}
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

                {/* Navigation and Filters Bar */}
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
                    {/* Month Navigator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#ffffff' }}>
                            {monthNames[month]} {year}
                        </h2>

                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                                onClick={prevMonth}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    color: '#ffffff',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                ◀
                            </button>
                            <button
                                onClick={goToToday}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: '6px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    color: '#ffffff',
                                    border: 'none',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Today
                            </button>
                            <button
                                onClick={nextMonth}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '6px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                    color: '#ffffff',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
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
                                padding: '8px 12px',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                color: '#ffffff',
                                fontSize: '13px'
                            }}
                        >
                            <option value="All" style={{ backgroundColor: '#0f172a' }}>All Sprints</option>
                            {sprints.map(s => (
                                <option key={s} value={s} style={{ backgroundColor: '#0f172a' }}>{s}</option>
                            ))}
                        </select>

                        <select
                            value={assigneeFilter}
                            onChange={(e) => setAssigneeFilter(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                color: '#ffffff',
                                fontSize: '13px'
                            }}
                        >
                            <option value="All" style={{ backgroundColor: '#0f172a' }}>All Assignees</option>
                            {assignees.map(([id, name]) => (
                                <option key={id} value={id.toString()} style={{ backgroundColor: '#0f172a' }}>{name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div style={{
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    overflow: 'hidden'
                }}>
                    {/* Weekday headers */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(7, 1fr)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        backgroundColor: 'rgba(0, 0, 0, 0.25)',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#94a3b8',
                        padding: '10px 0'
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
                                        padding: '8px',
                                        borderRight: (idx + 1) % 7 !== 0 ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                                        backgroundColor: !cell.isCurrentMonth
                                            ? 'rgba(0, 0, 0, 0.25)'
                                            : isToday
                                                ? 'rgba(59, 130, 246, 0.06)'
                                                : 'transparent',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.15s'
                                    }}
                                    onMouseOver={(e) => {
                                        if (cell.isCurrentMonth && !isToday) {
                                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        if (cell.isCurrentMonth && !isToday) {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                        }
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <span style={{
                                            fontSize: '12px',
                                            fontWeight: isToday ? '700' : '500',
                                            color: isToday
                                                ? '#3b82f6'
                                                : cell.isCurrentMonth ? '#cbd5e1' : '#475569',
                                            backgroundColor: isToday ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                            padding: isToday ? '2px 6px' : '0',
                                            borderRadius: '4px'
                                        }}>
                                            {cell.dayNumber}
                                        </span>

                                        {dayTasks.length > 0 && (
                                            <span style={{ fontSize: '10px', color: '#64748b' }}>
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
                                                        padding: '4px 6px',
                                                        borderRadius: '5px',
                                                        backgroundColor: isOverdue ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                                                        border: isOverdue ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                                                        fontSize: '11px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        gap: '4px',
                                                        cursor: 'pointer',
                                                        overflow: 'hidden'
                                                    }}
                                                    title={`${task.issueKey}: ${task.title} (${task.statusName})`}
                                                >
                                                    <span style={{
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        fontWeight: '500',
                                                        color: isOverdue ? '#fca5a5' : '#f1f5f9'
                                                    }}>
                                                        {task.issueKey}: {task.title}
                                                    </span>

                                                    <span style={{
                                                        width: '6px',
                                                        height: '6px',
                                                        borderRadius: '50%',
                                                        backgroundColor: task.statusColor || '#3b82f6',
                                                        flexShrink: 0
                                                    }} />
                                                </div>
                                            );
                                        })}

                                        {dayTasks.length > 4 && (
                                            <div style={{ fontSize: '10px', color: '#3b82f6', textAlign: 'center', marginTop: '2px' }}>
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
