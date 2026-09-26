import React, { useState, useEffect, useMemo } from 'react';
import api from '../Api/Axios';
import { jwtDecode } from 'jwt-decode';
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
        <div style={{ minHeight: '100%', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
            <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px 20px' }}>
                {/* Page Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.4px' }}>List</h1>
                        <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: '3px 0 0 0' }}>Search, filter, and manage all project issues and subtasks</p>
                    </div>
                    <button
                        onClick={() => {
                            setCreateParentTaskId(null);
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

                {/* Header & Filter Bar */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '14px',
                    marginBottom: '20px',
                    padding: '14px 18px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--bg-border)',
                    borderRadius: '10px',
                    boxShadow: 'var(--shadow-card)'
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
                                    backgroundColor: 'var(--bg-elevated)',
                                    border: '1px solid var(--bg-border)',
                                    color: 'var(--text-primary)',
                                    fontSize: '13px',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', fontSize: '13px' }}>
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
                                backgroundColor: 'var(--bg-elevated)',
                                border: '1px solid var(--bg-border)',
                                color: 'var(--text-primary)',
                                fontSize: '13px'
                            }}
                        >
                            <option value="All">All Sprints</option>
                            {sprints.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>

                        {/* Assignee Filter */}
                        <select
                            value={assigneeFilter}
                            onChange={(e) => setAssigneeFilter(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                backgroundColor: 'var(--bg-elevated)',
                                border: '1px solid var(--bg-border)',
                                color: 'var(--text-primary)',
                                fontSize: '13px'
                            }}
                        >
                            <option value="All">All Assignees</option>
                            {assignees.map(([id, name]) => (
                                <option key={id} value={id.toString()}>{name}</option>
                            ))}
                        </select>

                        {/* Issue Type Filter */}
                        <select
                            value={issueTypeFilter}
                            onChange={(e) => setIssueTypeFilter(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                backgroundColor: 'var(--bg-elevated)',
                                border: '1px solid var(--bg-border)',
                                color: 'var(--text-primary)',
                                fontSize: '13px'
                            }}
                        >
                            <option value="All">All Types</option>
                            {issueTypes.map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>

                        {/* Priority Filter */}
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                backgroundColor: 'var(--bg-elevated)',
                                border: '1px solid var(--bg-border)',
                                color: 'var(--text-primary)',
                                fontSize: '13px'
                            }}
                        >
                            <option value="All">All Priorities</option>
                            {priorities.map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>
                        Showing <strong style={{ color: 'var(--text-primary)' }}>{rootTasks.length}</strong> issues
                    </div>
                </div>

                {/* Tasks Table */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-tertiary)' }}>
                        <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚡</div>
                        <div>Loading issue list...</div>
                    </div>
                ) : rootTasks.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: '12px',
                        border: '1px dashed var(--bg-border)',
                        color: 'var(--text-tertiary)'
                    }}>
                        <div style={{ fontSize: '32px', marginBottom: '10px' }}>📑</div>
                        <h3 style={{ margin: '0 0 6px 0', color: 'var(--text-primary)' }}>No issues found</h3>
                        <p style={{ margin: 0, fontSize: '13px' }}>Try adjusting your filters or search query.</p>
                    </div>
                ) : (
                    <div style={{
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--bg-border)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: 'var(--shadow-card)'
                    }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{
                                        borderBottom: '1px solid var(--bg-border)',
                                        color: 'var(--text-secondary)',
                                        fontSize: '11px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.6px',
                                        backgroundColor: 'var(--bg-subtle)'
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
                                                        borderBottom: '1px solid var(--bg-border-subtle)',
                                                        cursor: 'pointer',
                                                        backgroundColor: 'transparent',
                                                        transition: 'background-color 0.15s ease'
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'}
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
                                                    <td style={{ padding: '12px 16px', fontWeight: '700', color: 'var(--accent)' }}>
                                                        {task.issueKey}
                                                    </td>

                                                    {/* Title & Subtask Badge */}
                                                    <td style={{ padding: '12px 16px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{task.title}</span>
                                                            {task.subtaskCount > 0 && (
                                                                <span style={{
                                                                    padding: '2px 6px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '10px',
                                                                    backgroundColor: 'rgba(2, 132, 199, 0.12)',
                                                                    color: 'var(--accent)',
                                                                    border: '1px solid rgba(2, 132, 199, 0.25)'
                                                                }}>
                                                                    {task.subtaskCompletedCount}/{task.subtaskCount} done
                                                                </span>
                                                            )}
                                                            {task.blockedByTaskIds?.length > 0 && (
                                                                <span style={{
                                                                    padding: '2px 6px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '10px',
                                                                    backgroundColor: 'rgba(220, 38, 38, 0.12)',
                                                                    color: 'var(--danger-text)',
                                                                    border: '1px solid rgba(220, 38, 38, 0.25)'
                                                                }} title="Blocked by other issues">
                                                                    ⛔ Blocked
                                                                </span>
                                                            )}
                                                            {!canModify && (
                                                                <span style={{ fontSize: '11px', color: 'var(--warning-text)' }} title="Restricted: Read-only">
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
                                                            backgroundColor: `${task.statusColor || '#64748b'}20`,
                                                            color: task.statusColor || 'var(--text-secondary)',
                                                            border: `1px solid ${task.statusColor || '#64748b'}40`
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
                                                            color: task.priorityColor || '#d97706',
                                                            fontWeight: '600'
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
                                                                backgroundColor: 'var(--accent)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '11px',
                                                                fontWeight: '700',
                                                                color: '#ffffff'
                                                            }}>
                                                                {task.userName ? task.userName[0].toUpperCase() : 'U'}
                                                            </div>
                                                            <span style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: '500' }}>
                                                                {task.userName || 'Unassigned'}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Sprint */}
                                                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                                                        {task.sprintName || '—'}
                                                    </td>

                                                    {/* Story Points */}
                                                    <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-primary)', fontWeight: '600' }}>
                                                        {task.storyPoints ?? '—'}
                                                    </td>

                                                    {/* Time Tracking */}
                                                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                                                        <span style={{ color: 'var(--success-text)', fontWeight: '600' }}>{formatMinutes(task.timeSpentMinutes)}</span>
                                                        {task.remainingEstimateMinutes ? (
                                                            <span> / {formatMinutes(task.remainingEstimateMinutes)}</span>
                                                        ) : null}
                                                    </td>

                                                    {/* Due Date */}
                                                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '12px' }}>
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
                                                                backgroundColor: 'var(--bg-elevated)',
                                                                color: 'var(--text-secondary)',
                                                                border: '1px solid var(--bg-border)',
                                                                cursor: 'pointer',
                                                                fontWeight: '600'
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
                                                            borderBottom: '1px solid var(--bg-border-subtle)',
                                                            backgroundColor: 'var(--bg-overlay)',
                                                            cursor: 'pointer'
                                                        }}
                                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'}
                                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-overlay)'}
                                                    >
                                                        <td style={{ padding: '10px 8px 10px 24px', color: 'var(--text-tertiary)' }}>↳</td>
                                                        <td style={{ padding: '10px 16px' }}>
                                                            <span style={{
                                                                fontSize: '10px',
                                                                padding: '1px 6px',
                                                                borderRadius: '4px',
                                                                backgroundColor: 'rgba(2, 132, 199, 0.12)',
                                                                color: 'var(--accent)',
                                                                fontWeight: '600'
                                                            }}>
                                                                Sub-task
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '10px 16px', color: 'var(--accent)', fontSize: '12px', fontWeight: '600' }}>
                                                            {st.issueKey}
                                                        </td>
                                                        <td style={{ padding: '10px 16px', paddingLeft: '32px', color: 'var(--text-primary)', fontWeight: '500' }}>
                                                            {st.title}
                                                        </td>
                                                        <td style={{ padding: '10px 16px' }}>
                                                            <span style={{
                                                                padding: '2px 6px',
                                                                borderRadius: '4px',
                                                                fontSize: '10px',
                                                                backgroundColor: `${st.statusColor || '#64748b'}20`,
                                                                color: st.statusColor || 'var(--text-secondary)'
                                                            }}>
                                                                {st.statusName}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '10px 16px', fontSize: '11px', color: st.priorityColor }}>
                                                            {st.priorityName}
                                                        </td>
                                                        <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                            {st.userName || 'Unassigned'}
                                                        </td>
                                                        <td style={{ padding: '10px 16px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                                                            {st.sprintName || '—'}
                                                        </td>
                                                        <td style={{ padding: '10px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                                            {st.storyPoints ?? '—'}
                                                        </td>
                                                        <td style={{ padding: '10px 16px', fontSize: '11px', color: 'var(--success-text)' }}>
                                                            {formatMinutes(st.timeSpentMinutes)}
                                                        </td>
                                                        <td style={{ padding: '10px 16px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
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


