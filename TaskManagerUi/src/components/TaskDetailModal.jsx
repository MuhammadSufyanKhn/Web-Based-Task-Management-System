import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { jwtDecode } from 'jwt-decode';
import api from '../Api/Axios';

const ISSUE_TYPE_OPTIONS = [
    { name: 'Task', icon: '✅', color: '#6366f1' },
    { name: 'Bug', icon: '🐞', color: '#ef4444' },
    { name: 'Story', icon: '📖', color: '#10b981' },
    { name: 'Epic', icon: '⚡', color: '#8b5cf6' },
    { name: 'Subtask', icon: '↳', color: '#06b6d4' }
];

const PRIORITY_OPTIONS = [
    { name: 'Highest', icon: '⬆️', color: '#ef4444' },
    { name: 'High', icon: '🔼', color: '#f97316' },
    { name: 'Medium', icon: '🟰', color: '#f59e0b' },
    { name: 'Low', icon: '🔽', color: '#10b981' },
    { name: 'Lowest', icon: '⬇️', color: '#6366f1' }
];

const TaskDetailModal = ({
    taskId,
    onClose,
    onTaskUpdated,
    statuses = [],
    members = [],
    components = [],
    allLabels = []
}) => {
    // Current user context
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    let currentUserId = null;
    let isAdmin = false;
    let currentUserName = 'User';

    if (token) {
        try {
            const decoded = jwtDecode(token);
            const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || 'User';
            isAdmin = role === 'Admin';
            currentUserId = parseInt(decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/nameidentifier"] ||
                                     decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || '0', 10);
            currentUserName = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/name"] || 'User';
        } catch {
            // Ignore decode error in test mocks
        }
    }

    const [activeTab, setActiveTab] = useState('details'); // 'details', 'time', 'dependencies', 'activity', 'jira'
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    // Filter choices fetched if not provided
    const [localStatuses, setLocalStatuses] = useState(statuses);
    const [localMembers, setLocalMembers] = useState(members);
    const [localComponents, setLocalComponents] = useState(components);
    const [sprintsList, setSprintsList] = useState([]);
    const [epicsList, setEpicsList] = useState([]);
    const [allOtherTasks, setAllOtherTasks] = useState([]);

    // Subtasks
    const [subtasks, setSubtasks] = useState([]);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [creatingSubtask, setCreatingSubtask] = useState(false);

    // Time Tracking & Live Timer
    const [timeSummary, setTimeSummary] = useState(null);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timerSeconds, setTimerSeconds] = useState(0);
    const timerRef = useRef(null);
    const [logWorkHours, setLogWorkHours] = useState('1');
    const [logWorkMins, setLogWorkMins] = useState('0');
    const [logWorkRemaining, setLogWorkRemaining] = useState('');
    const [logWorkDesc, setLogWorkDesc] = useState('');
    const [isLogWorkOpen, setIsLogWorkOpen] = useState(false);

    // Dependencies
    const [dependencies, setDependencies] = useState([]);
    const [depTargetId, setDepTargetId] = useState('');
    const [depType, setDepType] = useState('Blocks');

    // Activity Logs
    const [activityLogs, setActivityLogs] = useState([]);

    const [form, setForm] = useState({
        title: '',
        descriptions: '',
        statusId: '',
        priorityId: '',
        priorityName: 'Medium',
        issueTypeId: '',
        issueTypeName: 'Task',
        componentId: '',
        storyPoints: '',
        userId: '',
        assigneeName: '',
        createdBy: '',
        dueDate: '',
        sprintId: '',
        epicId: '',
        parentTaskId: '',
        parentTaskTitle: '',
        parentTaskKey: '',
        originalEstimateMinutes: '',
        remainingEstimateMinutes: '',
        timeSpentMinutes: 0,
        labels: [],
        issueKey: '',
        jiraIssueKey: '',
        jiraIssueUrl: '',
        createdDate: '',
        updatedDate: ''
    });

    const [newLabelInput, setNewLabelInput] = useState('');

    // Fetch master data if needed
    useEffect(() => {
        api.get('/sprint/all').then(res => setSprintsList(res.data || [])).catch(() => {});
        api.get('/epic').then(res => setEpicsList(res.data || [])).catch(() => {});
        api.get('/kanban/views/all-tasks').then(res => {
            setAllOtherTasks((res.data || []).filter(t => t.taskId !== taskId));
        }).catch(() => {});

        if (localStatuses.length === 0) {
            api.get('/projectconfig/statuses').then(res => setLocalStatuses(res.data || [])).catch(() => {});
        }
        if (localMembers.length === 0) {
            api.get('/user').then(res => setLocalMembers(res.data || [])).catch(() => {});
        }
    }, [taskId]);

    // Live Timer Stopwatch Effect
    useEffect(() => {
        if (isTimerRunning) {
            timerRef.current = setInterval(() => {
                setTimerSeconds(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isTimerRunning]);

    const formatTimerDisplay = (sec) => {
        const hrs = Math.floor(sec / 3600);
        const mins = Math.floor((sec % 3600) / 60);
        const secs = sec % 60;
        return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const formatMinutes = (mins) => {
        if (!mins || mins <= 0) return '0m';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        if (h > 0 && m > 0) return `${h}h ${m}m`;
        if (h > 0) return `${h}h`;
        return `${m}m`;
    };

    // Load Task Details
    const fetchDetails = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/kanban/task/${taskId}`);
            const data = res.data;
            setForm({
                title: data.title || '',
                descriptions: data.descriptions || '',
                statusId: data.statusId || '',
                priorityId: data.priorityId || '',
                priorityName: data.priorityName || 'Medium',
                issueTypeId: data.issueTypeId || '',
                issueTypeName: data.issueTypeName || 'Task',
                componentId: data.componentId || '',
                storyPoints: data.storyPoints ?? '',
                userId: data.userId || '',
                assigneeName: data.assigneeName || '',
                createdBy: data.createdBy || '',
                dueDate: data.dueDate ? data.dueDate.split('T')[0] : '',
                sprintId: data.sprintId ? String(data.sprintId) : '',
                epicId: data.epicId ? String(data.epicId) : '',
                parentTaskId: data.parentTaskId || '',
                parentTaskTitle: data.parentTaskTitle || '',
                parentTaskKey: data.parentTaskKey || '',
                originalEstimateMinutes: data.originalEstimateMinutes ?? '',
                remainingEstimateMinutes: data.remainingEstimateMinutes ?? '',
                timeSpentMinutes: data.timeSpentMinutes || 0,
                labels: data.labels || [],
                issueKey: data.issueKey || `TASK-${taskId}`,
                jiraIssueKey: data.jiraIssueKey || '',
                jiraIssueUrl: data.jiraIssueUrl || '',
                createdDate: data.createdDate || '',
                updatedDate: data.updatedDate || ''
            });

            setSubtasks(data.subtasks || []);
        } catch (err) {
            setError(err.response?.data?.message || err.userFriendlyMessage || 'Failed to load task details.');
        } finally {
            setLoading(false);
        }
    };

    // Load Time Tracking Logs
    const fetchTimeTracking = async () => {
        try {
            const res = await api.get(`/timetracking/task/${taskId}`);
            setTimeSummary(res.data);
            if (res.data.remainingEstimateMinutes !== undefined) {
                setLogWorkRemaining(String(Math.floor((res.data.remainingEstimateMinutes || 0) / 60)));
            }
        } catch {
            // Ignore
        }
    };

    // Load Dependencies
    const fetchDependencies = async () => {
        try {
            const res = await api.get(`/taskdependencies/task/${taskId}`);
            setDependencies(res.data || []);
        } catch {
            // Ignore
        }
    };

    // Load Activity History
    const fetchActivities = async () => {
        try {
            const res = await api.get(`/taskactivity/task/${taskId}`);
            setActivityLogs(res.data || []);
        } catch {
            // Ignore
        }
    };

    useEffect(() => {
        if (taskId) {
            fetchDetails();
            fetchTimeTracking();
            fetchDependencies();
            fetchActivities();
        }
    }, [taskId]);

    // Permissions check
    const isOwner = currentUserId && (form.userId === currentUserId || form.createdBy === currentUserId);
    const canEdit = !token || isAdmin || isOwner;
    const canDelete = !token || isAdmin || isOwner;
    const canReassign = !token || isAdmin;

    const handleSave = async () => {
        if (!canEdit) {
            setError("You don't have permission to edit this task. Only the task owner or an administrator can make changes.");
            return;
        }

        try {
            setSaving(true);
            setError(null);
            setSuccessMsg(null);

            const payload = {
                title: form.title,
                descriptions: form.descriptions,
                statusId: form.statusId ? parseInt(form.statusId) : null,
                priorityId: form.priorityId ? parseInt(form.priorityId) : null,
                issueTypeId: form.issueTypeId ? parseInt(form.issueTypeId) : null,
                componentId: form.componentId ? parseInt(form.componentId) : null,
                storyPoints: form.storyPoints !== '' ? parseInt(form.storyPoints) : null,
                userId: form.userId ? parseInt(form.userId) : null,
                dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
                sprintId: form.sprintId ? parseInt(form.sprintId) : null,
                epicId: form.epicId ? parseInt(form.epicId) : null,
                parentTaskId: form.parentTaskId ? parseInt(form.parentTaskId) : null,
                originalEstimateMinutes: form.originalEstimateMinutes !== '' ? parseInt(form.originalEstimateMinutes) : null,
                remainingEstimateMinutes: form.remainingEstimateMinutes !== '' ? parseInt(form.remainingEstimateMinutes) : null,
                labels: form.labels
            };

            await api.put(`/kanban/task/${taskId}`, payload);
            setSuccessMsg('Task updated successfully.');
            if (onTaskUpdated) onTaskUpdated();
            fetchActivities();
        } catch (err) {
            setError(err.response?.data?.message || err.userFriendlyMessage || 'Failed to save changes.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!canDelete) {
            setError("You don't have permission to delete this task. Only the task owner or an administrator can delete it.");
            return;
        }

        if (!window.confirm('Are you sure you want to delete this issue? This action cannot be undone.')) {
            return;
        }

        try {
            setDeleting(true);
            setError(null);
            await api.delete(`/kanban/task/${taskId}`);
            if (onTaskUpdated) onTaskUpdated();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || err.userFriendlyMessage || 'Failed to delete task.');
        } finally {
            setDeleting(false);
        }
    };

    // Subtask Creation
    const handleCreateSubtask = async (e) => {
        e.preventDefault();
        if (!newSubtaskTitle.trim()) return;

        try {
            setCreatingSubtask(true);
            await api.post(`/kanban/task/${taskId}/subtasks`, {
                title: newSubtaskTitle.trim(),
                sprintId: form.sprintId ? parseInt(form.sprintId) : null,
                epicId: form.epicId ? parseInt(form.epicId) : null
            });
            setNewSubtaskTitle('');
            fetchDetails();
            if (onTaskUpdated) onTaskUpdated();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create subtask.');
        } finally {
            setCreatingSubtask(false);
        }
    };

    // Time Tracking Logging
    const handleLogWork = async (e) => {
        e.preventDefault();
        const totalMinutes = (parseInt(logWorkHours || '0') * 60) + parseInt(logWorkMins || '0');
        if (totalMinutes <= 0) {
            setError('Please enter at least 1 minute of work.');
            return;
        }

        try {
            const remMins = logWorkRemaining !== '' ? parseInt(logWorkRemaining) * 60 : null;
            await api.post('/timetracking/log', {
                taskId: taskId,
                timeSpentMinutes: totalMinutes,
                remainingEstimateMinutes: remMins,
                description: logWorkDesc.trim() || undefined
            });

            setIsLogWorkOpen(false);
            setLogWorkDesc('');
            setTimerSeconds(0);
            setIsTimerRunning(false);
            fetchTimeTracking();
            fetchDetails();
            fetchActivities();
            if (onTaskUpdated) onTaskUpdated();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to log work.');
        }
    };

    const handleDeleteTimeLog = async (logId) => {
        if (!window.confirm('Delete this work log?')) return;
        try {
            await api.delete(`/timetracking/log/${logId}`);
            fetchTimeTracking();
            fetchDetails();
            fetchActivities();
            if (onTaskUpdated) onTaskUpdated();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete work log.');
        }
    };

    // Dependency Management
    const handleAddDependency = async (e) => {
        e.preventDefault();
        if (!depTargetId) {
            setError('Please select an issue to link.');
            return;
        }

        try {
            await api.post('/taskdependencies', {
                sourceTaskId: taskId,
                targetTaskId: parseInt(depTargetId),
                dependencyType: depType
            });
            setDepTargetId('');
            fetchDependencies();
            fetchActivities();
            if (onTaskUpdated) onTaskUpdated();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add dependency relationship.');
        }
    };

    const handleDeleteDependency = async (depId) => {
        try {
            await api.delete(`/taskdependencies/${depId}`);
            fetchDependencies();
            fetchActivities();
            if (onTaskUpdated) onTaskUpdated();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to remove dependency.');
        }
    };

    const handleAddLabel = () => {
        if (!newLabelInput.trim()) return;
        const val = newLabelInput.trim();
        if (!form.labels.includes(val)) {
            setForm({ ...form, labels: [...form.labels, val] });
        }
        setNewLabelInput('');
    };

    const handleRemoveLabel = (labelToRemove) => {
        setForm({
            ...form,
            labels: form.labels.filter(l => l !== labelToRemove)
        });
    };

    if (!taskId) return null;

    const navTabs = [
        { key: 'details', label: 'Details & Subtasks', icon: '📝' },
        { key: 'time', label: `Time Tracking (${formatMinutes(form.timeSpentMinutes)})`, icon: '⏱️' },
        { key: 'dependencies', label: `Dependencies (${dependencies.length})`, icon: '🔗' },
        { key: 'activity', label: 'Activity Log', icon: '📜' },
        { key: 'jira', label: 'Jira Cloud', icon: '☁️' }
    ];

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }} onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}>
            <div style={{
                backgroundColor: '#111827',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '14px',
                width: '100%',
                maxWidth: '1020px',
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                overflow: 'hidden',
                color: '#f8fafc'
            }}>
                {/* Header */}
                <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#161f30'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '18px' }}>
                            {ISSUE_TYPE_OPTIONS.find(i => i.name === form.issueTypeName)?.icon || '✅'}
                        </span>
                        <span style={{ fontSize: '16px', fontWeight: '700', color: '#60a5fa' }}>
                            {form.issueKey}
                        </span>

                        {form.parentTaskId ? (
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                                (Subtask of <strong>{form.parentTaskKey || `TASK-${form.parentTaskId}`}</strong>)
                            </span>
                        ) : null}

                        {!canEdit && (
                            <span style={{
                                fontSize: '11px',
                                fontWeight: '700',
                                color: '#fbbf24',
                                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                padding: '2px 8px',
                                borderRadius: '4px'
                            }}>
                                🔒 View Only Mode
                            </span>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Live Timer Widget */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '4px 10px',
                            backgroundColor: isTimerRunning ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                            border: isTimerRunning ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            fontSize: '12px'
                        }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: '700', color: isTimerRunning ? '#f87171' : '#cbd5e1' }}>
                                {formatTimerDisplay(timerSeconds)}
                            </span>
                            <button
                                onClick={() => {
                                    if (isTimerRunning) {
                                        setIsTimerRunning(false);
                                        const mins = Math.max(1, Math.round(timerSeconds / 60));
                                        setLogWorkHours(String(Math.floor(mins / 60)));
                                        setLogWorkMins(String(mins % 60));
                                        setIsLogWorkOpen(true);
                                    } else {
                                        setIsTimerRunning(true);
                                    }
                                }}
                                style={{
                                    border: 'none',
                                    backgroundColor: isTimerRunning ? '#ef4444' : '#10b981',
                                    color: '#ffffff',
                                    padding: '3px 8px',
                                    borderRadius: '5px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                {isTimerRunning ? 'Stop & Log' : 'Start Timer'}
                            </button>
                        </div>

                        {/* Delete button */}
                        <button
                            onClick={handleDelete}
                            disabled={!canDelete || deleting || loading}
                            title={!canDelete ? "You don't have permission to delete this task" : "Delete issue"}
                            style={{
                                backgroundColor: canDelete ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                color: canDelete ? '#f87171' : '#64748b',
                                border: canDelete ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '6px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: canDelete ? 'pointer' : 'not-allowed'
                            }}
                        >
                            {deleting ? 'Deleting...' : '🗑️ Delete'}
                        </button>

                        {/* Save button */}
                        <button
                            onClick={handleSave}
                            disabled={!canEdit || saving || loading}
                            style={{
                                background: canEdit ? '#3b82f6' : 'rgba(255, 255, 255, 0.08)',
                                color: canEdit ? '#ffffff' : '#64748b',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '6px 16px',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: canEdit ? 'pointer' : 'not-allowed'
                            }}
                        >
                            {saving ? 'Saving...' : 'Save'}
                        </button>

                        <button
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                fontSize: '18px',
                                cursor: 'pointer',
                                color: '#94a3b8'
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Sub-Tab Navigation Bar */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '0 24px',
                    backgroundColor: '#0f172a',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    overflowX: 'auto'
                }}>
                    {navTabs.map(tab => {
                        const isTabActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '12px 14px',
                                    background: 'transparent',
                                    border: 'none',
                                    borderBottom: isTabActive ? '2px solid #3b82f6' : '2px solid transparent',
                                    color: isTabActive ? '#ffffff' : '#94a3b8',
                                    fontWeight: isTabActive ? '600' : '500',
                                    fontSize: '13px',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Alerts */}
                {error && (
                    <div style={{ padding: '8px 24px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontSize: '12px', fontWeight: '600' }}>
                        ⚠️ {error}
                    </div>
                )}
                {successMsg && (
                    <div style={{ padding: '8px 24px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '12px', fontWeight: '600' }}>
                        ✓ {successMsg}
                    </div>
                )}

                {/* Body Content */}
                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                        Loading issue details...
                    </div>
                ) : (
                    <div style={{ display: 'flex', flex: 1, overflowY: 'auto' }}>
                        {/* MAIN TAB CONTENT AREA */}
                        <div style={{ flex: '1 1 65%', padding: '24px', borderRight: '1px solid rgba(255, 255, 255, 0.08)', overflowY: 'auto' }}>
                            {/* TAB 1: DETAILS & SUBTASKS */}
                            {activeTab === 'details' && (
                                <div>
                                    <div style={{ marginBottom: '18px' }}>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' }}>
                                            Title
                                        </label>
                                        <input
                                            type="text"
                                            value={form.title}
                                            disabled={!canEdit}
                                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                fontSize: '15px',
                                                fontWeight: '600',
                                                color: '#f8fafc',
                                                backgroundColor: canEdit ? '#1e293b' : 'rgba(255, 255, 255, 0.04)',
                                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                                borderRadius: '6px',
                                                outline: 'none',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '18px' }}>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' }}>
                                            Description
                                        </label>
                                        <textarea
                                            rows="5"
                                            value={form.descriptions}
                                            disabled={!canEdit}
                                            onChange={(e) => setForm({ ...form, descriptions: e.target.value })}
                                            placeholder={canEdit ? "Add a description..." : "No description provided."}
                                            style={{
                                                width: '100%',
                                                padding: '10px 12px',
                                                fontSize: '13px',
                                                color: '#f8fafc',
                                                backgroundColor: canEdit ? '#1e293b' : 'rgba(255, 255, 255, 0.04)',
                                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                                borderRadius: '6px',
                                                outline: 'none',
                                                resize: 'vertical',
                                                boxSizing: 'border-box',
                                                fontFamily: 'inherit'
                                            }}
                                        />
                                    </div>

                                    {/* Subtasks Section */}
                                    <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>
                                                Subtasks ({subtasks.length})
                                            </h4>
                                        </div>

                                        {/* Subtasks List */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                                            {subtasks.length === 0 ? (
                                                <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                                                    No subtasks yet.
                                                </div>
                                            ) : (
                                                subtasks.map(st => (
                                                    <div
                                                        key={st.taskId}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            padding: '8px 12px',
                                                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                                            border: '1px solid rgba(255, 255, 255, 0.06)',
                                                            borderRadius: '6px',
                                                            fontSize: '12px'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ color: '#60a5fa', fontWeight: '600' }}>{st.issueKey}</span>
                                                            <span style={{ color: '#e2e8f0' }}>{st.title}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <span style={{
                                                                padding: '2px 6px',
                                                                borderRadius: '4px',
                                                                fontSize: '10px',
                                                                backgroundColor: `${st.priorityColor}20`,
                                                                color: st.priorityColor
                                                            }}>
                                                                {st.statusName}
                                                            </span>
                                                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                                                                {st.assigneeName}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        {/* Add Subtask input */}
                                        {canEdit && (
                                            <form onSubmit={handleCreateSubtask} style={{ display: 'flex', gap: '8px' }}>
                                                <input
                                                    type="text"
                                                    placeholder="What needs to be done?"
                                                    value={newSubtaskTitle}
                                                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                                    style={{
                                                        flex: 1,
                                                        padding: '7px 10px',
                                                        fontSize: '12px',
                                                        backgroundColor: '#1e293b',
                                                        color: '#ffffff',
                                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                                        borderRadius: '6px'
                                                    }}
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={creatingSubtask || !newSubtaskTitle.trim()}
                                                    style={{
                                                        padding: '7px 14px',
                                                        backgroundColor: '#3b82f6',
                                                        color: '#ffffff',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    {creatingSubtask ? 'Adding...' : '+ Add Subtask'}
                                                </button>
                                            </form>
                                        )}
                                    </div>

                                    {/* Labels Section */}
                                    <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' }}>
                                            Labels
                                        </label>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                                            {form.labels.map((lbl, idx) => (
                                                <span key={idx} style={{
                                                    backgroundColor: 'rgba(139, 92, 246, 0.15)',
                                                    color: '#c4b5fd',
                                                    border: '1px solid rgba(139, 92, 246, 0.25)',
                                                    borderRadius: '4px',
                                                    padding: '3px 8px',
                                                    fontSize: '11px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}>
                                                    {lbl}
                                                    {canEdit && (
                                                        <span onClick={() => handleRemoveLabel(lbl)} style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                                                            ✕
                                                        </span>
                                                    )}
                                                </span>
                                            ))}
                                            {form.labels.length === 0 && (
                                                <span style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>None</span>
                                            )}
                                        </div>
                                        {canEdit && (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <input
                                                    type="text"
                                                    placeholder="Add label..."
                                                    value={newLabelInput}
                                                    onChange={(e) => setNewLabelInput(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddLabel(); } }}
                                                    style={{
                                                        padding: '6px 10px',
                                                        fontSize: '12px',
                                                        backgroundColor: '#1e293b',
                                                        color: '#f8fafc',
                                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                                        borderRadius: '6px',
                                                        width: '180px'
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleAddLabel}
                                                    style={{
                                                        padding: '6px 12px',
                                                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                                        color: '#f8fafc',
                                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                                        borderRadius: '6px',
                                                        fontSize: '12px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Add
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: TIME TRACKING */}
                            {activeTab === 'time' && (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>
                                            Time Tracking & Estimates
                                        </h3>
                                        <button
                                            onClick={() => setIsLogWorkOpen(true)}
                                            style={{
                                                padding: '6px 14px',
                                                backgroundColor: '#10b981',
                                                color: '#ffffff',
                                                border: 'none',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            + Log Work
                                        </button>
                                    </div>

                                    {/* Visual Progress Bar */}
                                    <div style={{
                                        padding: '16px',
                                        backgroundColor: 'rgba(0, 0, 0, 0.25)',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        borderRadius: '10px',
                                        marginBottom: '20px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                                            <div>
                                                <span style={{ color: '#94a3b8' }}>Time Spent: </span>
                                                <strong style={{ color: '#10b981' }}>{formatMinutes(form.timeSpentMinutes)}</strong>
                                            </div>
                                            <div>
                                                <span style={{ color: '#94a3b8' }}>Remaining: </span>
                                                <strong style={{ color: '#38bdf8' }}>{formatMinutes(form.remainingEstimateMinutes)}</strong>
                                            </div>
                                            <div>
                                                <span style={{ color: '#94a3b8' }}>Original Estimate: </span>
                                                <strong style={{ color: '#cbd5e1' }}>{formatMinutes(form.originalEstimateMinutes)}</strong>
                                            </div>
                                        </div>

                                        {/* Bar */}
                                        <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${Math.min(100, form.originalEstimateMinutes > 0 ? (form.timeSpentMinutes / form.originalEstimateMinutes) * 100 : 0)}%`,
                                                height: '100%',
                                                backgroundColor: '#10b981',
                                                borderRadius: '4px'
                                            }} />
                                        </div>
                                    </div>

                                    {/* Log Work Modal / Form */}
                                    {isLogWorkOpen && (
                                        <div style={{
                                            padding: '16px',
                                            backgroundColor: '#1e293b',
                                            border: '1px solid #3b82f6',
                                            borderRadius: '8px',
                                            marginBottom: '20px'
                                        }}>
                                            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#ffffff' }}>Log Work Done</h4>
                                            <form onSubmit={handleLogWork}>
                                                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Hours</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={logWorkHours}
                                                            onChange={(e) => setLogWorkHours(e.target.value)}
                                                            style={{ width: '80px', padding: '6px', borderRadius: '4px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff' }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Minutes</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="59"
                                                            value={logWorkMins}
                                                            onChange={(e) => setLogWorkMins(e.target.value)}
                                                            style={{ width: '80px', padding: '6px', borderRadius: '4px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff' }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Remaining Est. (hours)</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            placeholder="Auto adjust"
                                                            value={logWorkRemaining}
                                                            onChange={(e) => setLogWorkRemaining(e.target.value)}
                                                            style={{ width: '130px', padding: '6px', borderRadius: '4px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff' }}
                                                        />
                                                    </div>
                                                </div>

                                                <div style={{ marginBottom: '12px' }}>
                                                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Work Description</label>
                                                    <input
                                                        type="text"
                                                        placeholder="What work was completed?"
                                                        value={logWorkDesc}
                                                        onChange={(e) => setLogWorkDesc(e.target.value)}
                                                        style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#ffffff', boxSizing: 'border-box' }}
                                                    />
                                                </div>

                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        type="submit"
                                                        style={{ padding: '6px 14px', backgroundColor: '#10b981', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                                                    >
                                                        Save Log
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsLogWorkOpen(false)}
                                                        style={{ padding: '6px 12px', backgroundColor: 'transparent', color: '#94a3b8', border: '1px solid #475569', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    )}

                                    {/* Work Logs History Table */}
                                    <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#94a3b8' }}>Work Log History</h4>
                                    {(!timeSummary?.logs || timeSummary.logs.length === 0) ? (
                                        <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>No work logged on this task yet.</div>
                                    ) : (
                                        <div style={{ border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '6px', overflow: 'hidden' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)', color: '#94a3b8', textAlign: 'left' }}>
                                                        <th style={{ padding: '8px 12px' }}>User</th>
                                                        <th style={{ padding: '8px 12px' }}>Time</th>
                                                        <th style={{ padding: '8px 12px' }}>Description</th>
                                                        <th style={{ padding: '8px 12px' }}>Date</th>
                                                        <th style={{ padding: '8px 12px', textAlign: 'center' }}></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {timeSummary.logs.map(log => (
                                                        <tr key={log.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                                            <td style={{ padding: '8px 12px', fontWeight: '600', color: '#60a5fa' }}>{log.userName}</td>
                                                            <td style={{ padding: '8px 12px', color: '#10b981', fontWeight: '600' }}>{formatMinutes(log.timeSpentMinutes)}</td>
                                                            <td style={{ padding: '8px 12px', color: '#cbd5e1' }}>{log.description || '—'}</td>
                                                            <td style={{ padding: '8px 12px', color: '#64748b' }}>{new Date(log.loggedAt).toLocaleDateString()}</td>
                                                            <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                                                <button
                                                                    onClick={() => handleDeleteTimeLog(log.id)}
                                                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}
                                                                    title="Delete work log"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB 3: DEPENDENCIES */}
                            {activeTab === 'dependencies' && (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>
                                            Issue Dependencies & Links
                                        </h3>
                                    </div>

                                    {/* Add Dependency Form */}
                                    {canEdit && (
                                        <form onSubmit={handleAddDependency} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '12px',
                                            backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            borderRadius: '8px',
                                            marginBottom: '18px',
                                            flexWrap: 'wrap'
                                        }}>
                                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>This issue</span>
                                            <select
                                                value={depType}
                                                onChange={(e) => setDepType(e.target.value)}
                                                style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#ffffff', fontSize: '12px' }}
                                            >
                                                <option value="Blocks">blocks</option>
                                                <option value="IsBlockedBy">is blocked by</option>
                                                <option value="RelatesTo">relates to</option>
                                            </select>

                                            <select
                                                value={depTargetId}
                                                onChange={(e) => setDepTargetId(e.target.value)}
                                                style={{ flex: 1, minWidth: '220px', padding: '6px 10px', borderRadius: '6px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#ffffff', fontSize: '12px' }}
                                            >
                                                <option value="">Select target issue...</option>
                                                {allOtherTasks.map(t => (
                                                    <option key={t.taskId} value={t.taskId}>
                                                        {t.issueKey}: {t.title}
                                                    </option>
                                                ))}
                                            </select>

                                            <button
                                                type="submit"
                                                style={{ padding: '6px 14px', backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                                            >
                                                Link
                                            </button>
                                        </form>
                                    )}

                                    {/* Dependencies List */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {dependencies.length === 0 ? (
                                            <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                                                No linked dependencies for this issue.
                                            </div>
                                        ) : (
                                            dependencies.map(d => {
                                                const isSource = d.sourceTaskId === taskId;
                                                const otherKey = isSource ? d.targetTaskKey : d.sourceTaskKey;
                                                const otherTitle = isSource ? d.targetTaskTitle : d.sourceTaskTitle;
                                                const label = isSource ? (d.dependencyType === 'Blocks' ? 'Blocks' : d.dependencyType) : (d.dependencyType === 'Blocks' ? 'Is Blocked By' : d.dependencyType);

                                                return (
                                                    <div
                                                        key={d.id}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            padding: '10px 14px',
                                                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                                            border: '1px solid rgba(255, 255, 255, 0.06)',
                                                            borderRadius: '8px',
                                                            fontSize: '12px'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <span style={{
                                                                padding: '2px 8px',
                                                                borderRadius: '4px',
                                                                fontSize: '11px',
                                                                fontWeight: '600',
                                                                backgroundColor: label.includes('Blocked') ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                                                color: label.includes('Blocked') ? '#f87171' : '#60a5fa'
                                                            }}>
                                                                {label}
                                                            </span>
                                                            <strong style={{ color: '#ffffff' }}>{otherKey}</strong>
                                                            <span style={{ color: '#cbd5e1' }}>{otherTitle}</span>
                                                        </div>

                                                        {canEdit && (
                                                            <button
                                                                onClick={() => handleDeleteDependency(d.id)}
                                                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}
                                                                title="Unlink"
                                                            >
                                                                ✕
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB 4: ACTIVITY AUDIT HISTORY */}
                            {activeTab === 'activity' && (
                                <div>
                                    <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>
                                        Activity & Audit Trail
                                    </h3>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {activityLogs.length === 0 ? (
                                            <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                                                No activity records found.
                                            </div>
                                        ) : (
                                            activityLogs.map(a => (
                                                <div
                                                    key={a.id}
                                                    style={{
                                                        padding: '10px 14px',
                                                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                                        borderLeft: '3px solid #3b82f6',
                                                        borderRadius: '0 6px 6px 0',
                                                        fontSize: '12px'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                        <span style={{ fontWeight: '600', color: '#60a5fa' }}>{a.userName}</span>
                                                        <span style={{ color: '#64748b', fontSize: '11px' }}>
                                                            {new Date(a.createdDate).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div style={{ color: '#e2e8f0' }}>
                                                        {a.details || `${a.action} ${a.fieldName ? `(${a.fieldName})` : ''}`}
                                                    </div>
                                                    {a.oldValue && a.newValue && (
                                                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                                                            <span style={{ textDecoration: 'line-through' }}>{a.oldValue}</span> ➔ <strong style={{ color: '#38bdf8' }}>{a.newValue}</strong>
                                                        </div>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB 5: JIRA CLOUD */}
                            {activeTab === 'jira' && (
                                <div>
                                    <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>
                                        Jira Cloud Integration
                                    </h3>

                                    {form.jiraIssueKey ? (
                                        <div style={{
                                            padding: '16px',
                                            backgroundColor: 'rgba(0, 82, 204, 0.12)',
                                            border: '1px solid rgba(0, 82, 204, 0.3)',
                                            borderRadius: '10px'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                                <span style={{ fontSize: '20px' }}>🔷</span>
                                                <h4 style={{ margin: 0, color: '#ffffff', fontSize: '15px' }}>Linked to Jira Cloud</h4>
                                            </div>

                                            <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '14px' }}>
                                                Jira Issue Key: <strong style={{ color: '#60a5fa' }}>{form.jiraIssueKey}</strong>
                                            </div>

                                            {form.jiraIssueUrl && (
                                                <a
                                                    href={form.jiraIssueUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        padding: '8px 16px',
                                                        backgroundColor: '#0052cc',
                                                        color: '#ffffff',
                                                        textDecoration: 'none',
                                                        borderRadius: '6px',
                                                        fontSize: '12px',
                                                        fontWeight: '600'
                                                    }}
                                                >
                                                    Open in Jira Cloud ↗
                                                </a>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{
                                            padding: '24px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                            border: '1px dashed rgba(255, 255, 255, 0.1)',
                                            borderRadius: '8px',
                                            color: '#94a3b8',
                                            fontSize: '13px'
                                        }}>
                                            This task was created locally and is not yet synced to Jira Cloud.
                                            You can sync issues via <strong>Project Settings ➔ Jira Cloud</strong>.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* RIGHT SIDEBAR PROPERTIES */}
                        <div style={{ flex: '1 1 35%', padding: '24px', backgroundColor: '#161f30', overflowY: 'auto' }}>
                            <h4 style={{ margin: '0 0 16px 0', fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.6px', fontWeight: '700' }}>
                                Issue Properties
                            </h4>

                            {/* Status */}
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '4px' }}>
                                    Status
                                </label>
                                <select
                                    value={form.statusId}
                                    disabled={!canEdit}
                                    onChange={(e) => setForm({ ...form, statusId: e.target.value })}
                                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.12)', backgroundColor: canEdit ? '#1e293b' : 'rgba(255, 255, 255, 0.04)', fontSize: '13px', color: '#f8fafc', cursor: canEdit ? 'pointer' : 'not-allowed' }}
                                >
                                    {localStatuses.map(s => (
                                        <option key={s.id} value={s.id}>{s.displayName}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Issue Type */}
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '4px' }}>
                                    Issue Type
                                </label>
                                <select
                                    value={form.issueTypeId}
                                    disabled={!canEdit}
                                    onChange={(e) => {
                                        const opt = ISSUE_TYPE_OPTIONS.find(i => i.name === e.target.selectedOptions[0].text);
                                        setForm({ ...form, issueTypeId: e.target.value, issueTypeName: opt?.name || 'Task' });
                                    }}
                                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.12)', backgroundColor: canEdit ? '#1e293b' : 'rgba(255, 255, 255, 0.04)', fontSize: '13px', color: '#f8fafc', cursor: canEdit ? 'pointer' : 'not-allowed' }}
                                >
                                    {ISSUE_TYPE_OPTIONS.map((item, idx) => (
                                        <option key={idx} value={idx + 1}>{item.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Assignee */}
                            <div style={{ marginBottom: '14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>Assignee</label>
                                    {!canReassign && (
                                        <span style={{ fontSize: '10px', color: '#fbbf24' }}>🔒 Admin only</span>
                                    )}
                                </div>
                                <select
                                    value={form.userId}
                                    disabled={!canReassign}
                                    onChange={(e) => setForm({ ...form, userId: e.target.value })}
                                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.12)', backgroundColor: canReassign ? '#1e293b' : 'rgba(255, 255, 255, 0.04)', fontSize: '13px', color: '#f8fafc', cursor: canReassign ? 'pointer' : 'not-allowed' }}
                                >
                                    <option value="">Unassigned</option>
                                    {localMembers.map(m => (
                                        <option key={m.userId} value={m.userId}>{m.userName} ({m.email})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Priority */}
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '4px' }}>Priority</label>
                                <select
                                    value={form.priorityId}
                                    disabled={!canEdit}
                                    onChange={(e) => setForm({ ...form, priorityId: e.target.value })}
                                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.12)', backgroundColor: canEdit ? '#1e293b' : 'rgba(255, 255, 255, 0.04)', fontSize: '13px', color: '#f8fafc', cursor: canEdit ? 'pointer' : 'not-allowed' }}
                                >
                                    {PRIORITY_OPTIONS.map((p, idx) => (
                                        <option key={idx} value={idx + 1}>{p.icon} {p.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Story Points */}
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '4px' }}>Story Points</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={form.storyPoints}
                                    disabled={!canEdit}
                                    onChange={(e) => setForm({ ...form, storyPoints: e.target.value })}
                                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.12)', backgroundColor: canEdit ? '#1e293b' : 'rgba(255, 255, 255, 0.04)', fontSize: '13px', color: '#f8fafc', boxSizing: 'border-box' }}
                                />
                            </div>

                            {/* Original Estimate */}
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '4px' }}>
                                    Original Estimate (minutes)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="e.g. 120"
                                    value={form.originalEstimateMinutes}
                                    disabled={!canEdit}
                                    onChange={(e) => setForm({ ...form, originalEstimateMinutes: e.target.value })}
                                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.12)', backgroundColor: canEdit ? '#1e293b' : 'rgba(255, 255, 255, 0.04)', fontSize: '13px', color: '#f8fafc', boxSizing: 'border-box' }}
                                />
                            </div>

                            {/* Due Date */}
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '4px' }}>Due Date</label>
                                <input
                                    type="date"
                                    value={form.dueDate}
                                    disabled={!canEdit}
                                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.12)', backgroundColor: canEdit ? '#1e293b' : 'rgba(255, 255, 255, 0.04)', fontSize: '13px', color: '#f8fafc', boxSizing: 'border-box' }}
                                />
                            </div>

                            {/* Sprint */}
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '4px' }}>Sprint</label>
                                <select
                                    value={form.sprintId}
                                    disabled={!canEdit}
                                    onChange={(e) => setForm({ ...form, sprintId: e.target.value })}
                                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.12)', backgroundColor: canEdit ? '#1e293b' : 'rgba(255, 255, 255, 0.04)', fontSize: '13px', color: '#f8fafc' }}
                                >
                                    <option value="">Backlog (No Sprint)</option>
                                    {sprintsList.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Epic */}
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '4px' }}>Epic</label>
                                <select
                                    value={form.epicId}
                                    disabled={!canEdit}
                                    onChange={(e) => setForm({ ...form, epicId: e.target.value })}
                                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.12)', backgroundColor: canEdit ? '#1e293b' : 'rgba(255, 255, 255, 0.04)', fontSize: '13px', color: '#f8fafc' }}
                                >
                                    <option value="">None (No Epic)</option>
                                    {epicsList.map(ep => (
                                        <option key={ep.id} value={ep.id}>⚡ {ep.key} &mdash; {ep.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Audit Dates */}
                            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', fontSize: '11px', color: '#64748b' }}>
                                <div>Created: {form.createdDate ? new Date(form.createdDate).toLocaleDateString() : 'N/A'}</div>
                                {form.updatedDate && (
                                    <div style={{ marginTop: '4px' }}>
                                        Updated: {new Date(form.updatedDate).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

TaskDetailModal.propTypes = {
    taskId: PropTypes.number,
    onClose: PropTypes.func.isRequired,
    onTaskUpdated: PropTypes.func.isRequired,
    statuses: PropTypes.array,
    members: PropTypes.array,
    components: PropTypes.array,
    allLabels: PropTypes.array
};

export default TaskDetailModal;
