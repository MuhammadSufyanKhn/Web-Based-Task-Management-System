import React, { useState, useEffect, useMemo } from 'react';
import api from '../Api/Axios';
import { jwtDecode } from 'jwt-decode';
import AppNavbar from '../components/AppNavbar';
import ViewSwitcher from '../components/ViewSwitcher';
import TaskDetailModal from '../components/TaskDetailModal';
import CreateIssueModal from '../components/CreateIssueModal';
import PermissionModal from '../components/PermissionModal';

const ListView = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sprintFilter, setSprintFilter] = useState('All');
    const [assigneeFilter, setAssigneeFilter] = useState('All');
    const [issueTypeFilter, setIssueTypeFilter] = useState('All');
    const [priorityFilter, setPriorityFilter] = useState('All');
    const [expandedParents, setExpandedParents] = useState({});

    // Modals
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createParentTaskId, setCreateParentTaskId] = useState(null);
    const [permissionModal, setPermissionModal] = useState({ isOpen: false, title: '', message: '' });

    // Current user context
    const token = localStorage.getItem('token');
    let currentUserId = 0;
    let currentUserRole = 'User';

    if (token) {
        try {
            const decoded = jwtDecode(token);
            currentUserId = parseInt(decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/nameidentifier"] || '0', 10);
            currentUserRole = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || 'User';
        } catch {
            currentUserId = 0;
            currentUserRole = 'User';
        }
    }

    const isAdmin = currentUserRole === 'Admin';

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const res = await api.get('/kanban/views/all-tasks');
            setTasks(res.data || []);
        } catch (err) {
            console.error('Failed to load tasks for List View', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

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

    const issueTypes = useMemo(() => {
        const set = new Set();
        tasks.forEach(t => { if (t.issueTypeName) set.add(t.issueTypeName); });
        return Array.from(set);
    }, [tasks]);

    const priorities = ['High', 'Medium', 'Low'];

    // Group into root tasks (tasks without ParentTaskId or parent not found)
    const filteredTasks = useMemo(() => {
        return tasks.filter(t => {
            if (sprintFilter !== 'All' && t.sprintName !== sprintFilter) return false;
            if (assigneeFilter !== 'All' && t.userId?.toString() !== assigneeFilter) return false;
            if (issueTypeFilter !== 'All' && t.issueTypeName !== issueTypeFilter) return false;
            if (priorityFilter !== 'All' && t.priorityName !== priorityFilter) return false;
            if (search.trim()) {
                const s = search.toLowerCase();
                const matchTitle = t.title?.toLowerCase().includes(s);
                const matchKey = t.issueKey?.toLowerCase().includes(s);
                const matchDesc = t.descriptions?.toLowerCase().includes(s);
                if (!matchTitle && !matchKey && !matchDesc) return false;
            }
            return true;
        });
    }, [tasks, sprintFilter, assigneeFilter, issueTypeFilter, priorityFilter, search]);

    const rootTasks = useMemo(() => {
        // Only top-level items in main table list; subtasks appear nested under parents
        return filteredTasks.filter(t => !t.parentTaskId);
    }, [filteredTasks]);

    const toggleExpand = (taskId) => {
        setExpandedParents(prev => ({
            ...prev,
            [taskId]: !prev[taskId]
        }));
    };

    const handleTaskClick = (task) => {
        setSelectedTaskId(task.taskId);
    };

    const handleAddSubtask = (e, parentId) => {
        e.stopPropagation();
        setCreateParentTaskId(parentId);
        setIsCreateModalOpen(true);
    };

    const formatMinutes = (mins) => {
        if (!mins || mins <= 0) return '0m';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (h > 0 && m > 0) return `${h}h ${m}m`;
        if (h > 0) return `${h}h`;
        return `${m}m`;
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#090d16', color: '#f8fafc' }}>
            <AppNavbar />

            <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px 20px' }}>
                <ViewSwitcher
                    rightContent={
                        <button
                            onClick={() => {
                                setCreateParentTaskId(null);
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

                {/* Header & Filter Bar */}
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
                        {/* Search Input */}
                        <div style={{ position: 'relative', minWidth: '220px' }}>
                            <input
                                type="text"
                                placeholder="Search issues..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px 8px 32px',
                                    borderRadius: '8px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    color: '#ffffff',
                                    fontSize: '13px',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: '13px' }}>
                                🔍
                            </span>
                        </div>

                        {/* Sprint Filter */}
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

                        {/* Assignee Filter */}
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

                        {/* Issue Type Filter */}
                        <select
                            value={issueTypeFilter}
                            onChange={(e) => setIssueTypeFilter(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                color: '#ffffff',
                                fontSize: '13px'
                            }}
                        >
                            <option value="All" style={{ backgroundColor: '#0f172a' }}>All Types</option>
                            {issueTypes.map(t => (
                                <option key={t} value={t} style={{ backgroundColor: '#0f172a' }}>{t}</option>
                            ))}
                        </select>

                        {/* Priority Filter */}
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                color: '#ffffff',
                                fontSize: '13px'
                            }}
                        >
                            <option value="All" style={{ backgroundColor: '#0f172a' }}>All Priorities</option>
                            {priorities.map(p => (
                                <option key={p} value={p} style={{ backgroundColor: '#0f172a' }}>{p}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ color: '#94a3b8', fontSize: '13px' }}>
                        Showing <strong style={{ color: '#ffffff' }}>{rootTasks.length}</strong> issues
                    </div>
                </div>

                {/* Tasks Table */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚡</div>
                        <div>Loading issue list...</div>
                    </div>
                ) : rootTasks.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        backgroundColor: '#0f172a',
                        borderRadius: '12px',
                        border: '1px dashed rgba(255, 255, 255, 0.12)',
                        color: '#94a3b8'
                    }}>
                        <div style={{ fontSize: '32px', marginBottom: '10px' }}>📑</div>
                        <h3 style={{ margin: '0 0 6px 0', color: '#ffffff' }}>No issues found</h3>
                        <p style={{ margin: 0, fontSize: '13px' }}>Try adjusting your filters or search query.</p>
                    </div>
                ) : (
                    <div style={{
                        backgroundColor: '#0f172a',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        overflow: 'hidden'
                    }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                        color: '#94a3b8',
                                        fontSize: '11px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.6px',
                                        backgroundColor: 'rgba(0, 0, 0, 0.2)'
                                    }}>
                                        <th style={{ padding: '12px 16px', width: '36px' }}></th>
                                        <th style={{ padding: '12px 16px', width: '80px' }}>Type</th>
                                        <th style={{ padding: '12px 16px', width: '110px' }}>Key</th>
                                        <th style={{ padding: '12px 16px' }}>Summary</th>
                                        <th style={{ padding: '12px 16px', width: '130px' }}>Status</th>
                                        <th style={{ padding: '12px 16px', width: '100px' }}>Priority</th>
                                        <th style={{ padding: '12px 16px', width: '150px' }}>Assignee</th>
                                        <th style={{ padding: '12px 16px', width: '90px' }}>Sprint</th>
                                        <th style={{ padding: '12px 16px', width: '70px', textAlign: 'center' }}>Pts</th>
                                        <th style={{ padding: '12px 16px', width: '110px' }}>Time</th>
                                        <th style={{ padding: '12px 16px', width: '100px' }}>Due</th>
                                        <th style={{ padding: '12px 16px', width: '80px', textAlign: 'center' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rootTasks.map(task => {
                                        const isOwner = task.userId === currentUserId;
                                        const canModify = isAdmin || isOwner;
                                        const subtasks = tasks.filter(st => st.parentTaskId === task.taskId);
                                        const hasSubtasks = subtasks.length > 0;
                                        const isExpanded = !!expandedParents[task.taskId];

                                        return (
                                            <React.Fragment key={task.taskId}>
                                                <tr
                                                    onClick={() => handleTaskClick(task)}
                                                    style={{
                                                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                                        cursor: 'pointer',
                                                        backgroundColor: 'transparent',
                                                        transition: 'background-color 0.15s ease'
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)'}
                                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    {/* Expand Toggle */}
                                                    <td style={{ padding: '12px 8px 12px 16px', textAlign: 'center' }} onClick={(e) => {
                                                        if (hasSubtasks) {
                                                            e.stopPropagation();
                                                            toggleExpand(task.taskId);
                                                        }
                                                    }}>
                                                        {hasSubtasks ? (
                                                            <span style={{
                                                                display: 'inline-block',
                                                                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                                                transition: 'transform 0.2s',
                                                                color: '#3b82f6',
                                                                fontSize: '11px'
                                                            }}>
                                                                ▶
                                                            </span>
                                                        ) : (
                                                            <span style={{ color: 'rgba(255, 255, 255, 0.2)' }}>•</span>
                                                        )}
                                                    </td>

                                                    {/* Issue Type */}
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            padding: '2px 8px',
                                                            borderRadius: '4px',
                                                            backgroundColor: 'rgba(255, 255, 255, 0.06)',
                                                            color: task.issueTypeColor || '#93c5fd',
                                                            fontWeight: '600',
                                                            fontSize: '11px'
                                                        }}>
                                                            {task.issueTypeName}
                                                        </span>
                                                    </td>

                                                    {/* Key */}
                                                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#60a5fa' }}>
                                                        {task.issueKey}
                                                    </td>

                                                    {/* Title & Subtask Badge */}
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontWeight: '500', color: '#ffffff' }}>{task.title}</span>
                                                            {task.subtaskCount > 0 && (
                                                                <span style={{
                                                                    padding: '2px 6px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '10px',
                                                                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                                                                    color: '#a5b4fc',
                                                                    border: '1px solid rgba(99, 102, 241, 0.3)'
                                                                }}>
                                                                    {task.subtaskCompletedCount}/{task.subtaskCount} done
                                                                </span>
                                                            )}
                                                            {task.blockedByTaskIds?.length > 0 && (
                                                                <span style={{
                                                                    padding: '2px 6px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '10px',
                                                                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                                                    color: '#f87171',
                                                                    border: '1px solid rgba(239, 68, 68, 0.3)'
                                                                }} title="Blocked by other issues">
                                                                    ⛔ Blocked
                                                                </span>
                                                            )}
                                                            {!canModify && (
                                                                <span style={{ fontSize: '11px', color: '#f59e0b' }} title="Restricted: Read-only">
                                                                    🔒
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Status */}
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <span style={{
                                                            padding: '3px 8px',
                                                            borderRadius: '6px',
                                                            fontSize: '11px',
                                                            fontWeight: '600',
                                                            backgroundColor: `${task.statusColor || '#64748b'}25`,
                                                            color: task.statusColor || '#94a3b8',
                                                            border: `1px solid ${task.statusColor || '#64748b'}50`
                                                        }}>
                                                            {task.statusName}
                                                        </span>
                                                    </td>

                                                    {/* Priority */}
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <span style={{
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            fontSize: '11px',
                                                            color: task.priorityColor || '#ffab00',
                                                            fontWeight: '500'
                                                        }}>
                                                            {task.priorityName}
                                                        </span>
                                                    </td>

                                                    {/* Assignee */}
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{
                                                                width: '24px',
                                                                height: '24px',
                                                                borderRadius: '50%',
                                                                backgroundColor: '#3b82f6',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '11px',
                                                                fontWeight: '600',
                                                                color: '#ffffff'
                                                            }}>
                                                                {task.userName ? task.userName[0].toUpperCase() : 'U'}
                                                            </div>
                                                            <span style={{ color: '#e2e8f0', fontSize: '12px' }}>
                                                                {task.userName || 'Unassigned'}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Sprint */}
                                                    <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '12px' }}>
                                                        {task.sprintName || '—'}
                                                    </td>

                                                    {/* Story Points */}
                                                    <td style={{ padding: '12px 16px', textAlign: 'center', color: '#cbd5e1' }}>
                                                        {task.storyPoints ?? '—'}
                                                    </td>

                                                    {/* Time Tracking */}
                                                    <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '12px' }}>
                                                        <span style={{ color: '#10b981' }}>{formatMinutes(task.timeSpentMinutes)}</span>
                                                        {task.remainingEstimateMinutes ? (
                                                            <span> / {formatMinutes(task.remainingEstimateMinutes)}</span>
                                                        ) : null}
                                                    </td>

                                                    {/* Due Date */}
                                                    <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '12px' }}>
                                                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
                                                    </td>

                                                    {/* Action: Add subtask */}
                                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                        <button
                                                            onClick={(e) => handleAddSubtask(e, task.taskId)}
                                                            style={{
                                                                padding: '3px 8px',
                                                                borderRadius: '4px',
                                                                fontSize: '11px',
                                                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                                color: '#94a3b8',
                                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                                                cursor: 'pointer'
                                                            }}
                                                            title="Add Subtask"
                                                        >
                                                            + Subtask
                                                        </button>
                                                    </td>
                                                </tr>

                                                {/* Expanded Subtasks Rows */}
                                                {isExpanded && subtasks.map(st => (
                                                    <tr
                                                        key={`st-${st.taskId}`}
                                                        onClick={() => handleTaskClick(st)}
                                                        style={{
                                                            borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                                                            backgroundColor: 'rgba(0, 0, 0, 0.18)',
                                                            cursor: 'pointer'
                                                        }}
                                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)'}
                                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.18)'}
                                                    >
                                                        <td style={{ padding: '10px 8px 10px 24px', color: '#64748b' }}>↳</td>
                                                        <td style={{ padding: '10px 16px' }}>
                                                            <span style={{
                                                                fontSize: '10px',
                                                                padding: '1px 6px',
                                                                borderRadius: '4px',
                                                                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                                                                color: '#818cf8',
                                                                fontWeight: '600'
                                                            }}>
                                                                Sub-task
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '10px 16px', color: '#93c5fd', fontSize: '12px' }}>
                                                            {st.issueKey}
                                                        </td>
                                                        <td style={{ padding: '10px 16px', paddingLeft: '32px', color: '#cbd5e1' }}>
                                                            {st.title}
                                                        </td>
                                                        <td style={{ padding: '10px 16px' }}>
                                                            <span style={{
                                                                padding: '2px 6px',
                                                                borderRadius: '4px',
                                                                fontSize: '10px',
                                                                backgroundColor: `${st.statusColor || '#64748b'}20`,
                                                                color: st.statusColor || '#94a3b8'
                                                            }}>
                                                                {st.statusName}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '10px 16px', fontSize: '11px', color: st.priorityColor }}>
                                                            {st.priorityName}
                                                        </td>
                                                        <td style={{ padding: '10px 16px', fontSize: '12px', color: '#94a3b8' }}>
                                                            {st.userName || 'Unassigned'}
                                                        </td>
                                                        <td style={{ padding: '10px 16px', fontSize: '12px', color: '#64748b' }}>
                                                            {st.sprintName || '—'}
                                                        </td>
                                                        <td style={{ padding: '10px 16px', textAlign: 'center', color: '#64748b' }}>
                                                            {st.storyPoints ?? '—'}
                                                        </td>
                                                        <td style={{ padding: '10px 16px', fontSize: '11px', color: '#10b981' }}>
                                                            {formatMinutes(st.timeSpentMinutes)}
                                                        </td>
                                                        <td style={{ padding: '10px 16px', fontSize: '11px', color: '#64748b' }}>
                                                            {st.dueDate ? new Date(st.dueDate).toLocaleDateString() : '—'}
                                                        </td>
                                                        <td></td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
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

            {/* Create Issue / Subtask Modal */}
            {isCreateModalOpen && (
                <CreateIssueModal
                    isOpen={isCreateModalOpen}
                    parentTaskId={createParentTaskId}
                    onClose={() => {
                        setIsCreateModalOpen(false);
                        setCreateParentTaskId(null);
                    }}
                    onCreated={() => {
                        setIsCreateModalOpen(false);
                        setCreateParentTaskId(null);
                        fetchTasks();
                    }}
                />
            )}

            {/* Permission Alert Modal */}
            <PermissionModal
                isOpen={permissionModal.isOpen}
                title={permissionModal.title}
                message={permissionModal.message}
                onClose={() => setPermissionModal({ isOpen: false, title: '', message: '' })}
            />
        </div>
    );
};

export default ListView;
