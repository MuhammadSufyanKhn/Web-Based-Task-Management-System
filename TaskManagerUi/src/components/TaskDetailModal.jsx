import React, { useState, useEffect } from 'react';
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
    statuses,
    members,
    components,
    allLabels
}) => {
    // Current user context
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    let currentUserId = null;
    let isAdmin = false;
    if (token) {
        try {
            const decoded = jwtDecode(token);
            const role = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || 'User';
            isAdmin = role === 'Admin';
            currentUserId = parseInt(decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]);
        } catch {
            // Ignore decode error in test mocks
        }
    }

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState(null);
    const [newLabelInput, setNewLabelInput] = useState('');
    const [sprintsList, setSprintsList] = useState([]);
    const [epicsList, setEpicsList] = useState([]);

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
        labels: [],
        issueKey: '',
        createdDate: '',
        updatedDate: ''
    });

    useEffect(() => {
        api.get('/sprint/all').then(res => setSprintsList(res.data || [])).catch(() => {});
        api.get('/epic').then(res => setEpicsList(res.data || [])).catch(() => {});
    }, []);

    useEffect(() => {
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
                    labels: data.labels || [],
                    issueKey: data.issueKey || `TASK-${taskId}`,
                    createdDate: data.createdDate || '',
                    updatedDate: data.updatedDate || ''
                });
            } catch (err) {
                setError(err.response?.data?.message || err.userFriendlyMessage || 'Failed to load task details.');
            } finally {
                setLoading(false);
            }
        };

        if (taskId) {
            fetchDetails();
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
                labels: form.labels
            };

            await api.put(`/kanban/task/${taskId}`, payload);
            if (onTaskUpdated) onTaskUpdated();
            onClose();
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

    const handleAddLabel = () => {
        if (!canEdit || !newLabelInput.trim()) return;
        const trimmed = newLabelInput.trim();
        if (!form.labels.includes(trimmed)) {
            setForm({ ...form, labels: [...form.labels, trimmed] });
        }
        setNewLabelInput('');
    };

    const handleRemoveLabel = (labelToRemove) => {
        if (!canEdit) return;
        setForm({
            ...form,
            labels: form.labels.filter(l => l !== labelToRemove)
        });
    };

    if (!taskId) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
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
                borderRadius: '12px',
                width: '100%',
                maxWidth: '960px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
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
                        <span style={{
                            fontSize: '15px',
                            fontWeight: '700',
                            color: '#94a3b8',
                            letterSpacing: '0.4px'
                        }}>
                            {form.issueKey}
                        </span>

                        {!canEdit && (
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
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
                        {/* Delete button (Disabled with tooltip if unauthorized) */}
                        <button
                            onClick={handleDelete}
                            disabled={!canDelete || deleting || loading}
                            title={!canDelete ? "You don't have permission to delete this task" : "Delete issue"}
                            style={{
                                backgroundColor: canDelete ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                color: canDelete ? '#f87171' : '#64748b',
                                border: canDelete ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '6px',
                                padding: '8px 14px',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: canDelete ? 'pointer' : 'not-allowed',
                                transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={(e) => {
                                if (canDelete) e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.25)';
                            }}
                            onMouseLeave={(e) => {
                                if (canDelete) e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                            }}
                        >
                            {deleting ? 'Deleting...' : '🗑️ Delete'}
                        </button>

                        {/* Save button (Disabled with tooltip if unauthorized) */}
                        <button
                            onClick={handleSave}
                            disabled={!canEdit || saving || loading}
                            title={!canEdit ? "You don't have permission to edit this task" : "Save changes"}
                            style={{
                                background: canEdit
                                    ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                                    : 'rgba(255, 255, 255, 0.08)',
                                color: canEdit ? '#ffffff' : '#64748b',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '8px 18px',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: canEdit ? 'pointer' : 'not-allowed',
                                boxShadow: canEdit ? '0 2px 6px rgba(99, 102, 241, 0.35)' : 'none',
                                opacity: saving ? 0.7 : 1,
                                transition: 'all 0.15s ease'
                            }}
                        >
                            {saving ? 'Saving...' : canEdit ? 'Save Changes' : 'View Only'}
                        </button>

                        <button
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                fontSize: '18px',
                                cursor: 'pointer',
                                color: '#94a3b8',
                                padding: '4px 8px',
                                borderRadius: '6px'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* View-Only Banner for non-owners */}
                {!canEdit && (
                    <div style={{
                        padding: '10px 24px',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        borderBottom: '1px solid rgba(245, 158, 11, 0.25)',
                        color: '#fbbf24',
                        fontSize: '13px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span>🔒</span>
                        <span>
                            This task is assigned to <strong>{form.assigneeName || 'another team member'}</strong>. You can view all task details, but only the task owner or an administrator can edit or delete this task.
                        </span>
                    </div>
                )}

                {/* Error alert */}
                {error && (
                    <div style={{
                        padding: '10px 24px',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171',
                        fontSize: '13px',
                        fontWeight: '600'
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* Modal Body */}
                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                        Loading issue details...
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        flex: 1,
                        overflowY: 'auto'
                    }}>
                        {/* Left column: Title & Description */}
                        <div style={{ flex: '1 1 60%', padding: '24px', borderRight: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' }}>
                                    Title {!canEdit && <span style={{ color: '#f59e0b', fontSize: '11px' }}>(Read-Only)</span>}
                                </label>
                                <input
                                    type="text"
                                    value={form.title}
                                    disabled={!canEdit}
                                    title={!canEdit ? "You don't have permission to edit this task" : undefined}
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
                                        boxSizing: 'border-box',
                                        cursor: canEdit ? 'text' : 'not-allowed'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' }}>
                                    Description {!canEdit && <span style={{ color: '#f59e0b', fontSize: '11px' }}>(Read-Only)</span>}
                                </label>
                                <textarea
                                    rows="8"
                                    value={form.descriptions}
                                    disabled={!canEdit}
                                    title={!canEdit ? "You don't have permission to edit this task" : undefined}
                                    onChange={(e) => setForm({ ...form, descriptions: e.target.value })}
                                    placeholder={canEdit ? "Add a more detailed description..." : "No description provided."}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        fontSize: '14px',
                                        color: '#f8fafc',
                                        backgroundColor: canEdit ? '#1e293b' : 'rgba(255, 255, 255, 0.04)',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        borderRadius: '6px',
                                        outline: 'none',
                                        resize: 'vertical',
                                        boxSizing: 'border-box',
                                        fontFamily: 'inherit',
                                        cursor: canEdit ? 'text' : 'not-allowed'
                                    }}
                                />
                            </div>

                            {/* Labels section */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '6px' }}>
                                    Labels {!canEdit && <span style={{ color: '#f59e0b', fontSize: '11px' }}>(Read-Only)</span>}
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                                    {form.labels.map((lbl, idx) => (
                                        <span key={idx} style={{
                                            backgroundColor: 'rgba(139, 92, 246, 0.15)',
                                            color: '#c4b5fd',
                                            border: '1px solid rgba(139, 92, 246, 0.25)',
                                            borderRadius: '4px',
                                            padding: '4px 8px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            {lbl}
                                            {canEdit && (
                                                <span
                                                    onClick={() => handleRemoveLabel(lbl)}
                                                    style={{ cursor: 'pointer', fontWeight: 'bold' }}
                                                    title="Remove label"
                                                >
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
                                                fontSize: '13px',
                                                backgroundColor: '#1e293b',
                                                color: '#f8fafc',
                                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                                borderRadius: '6px',
                                                flex: 1
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
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Add
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right column: Jira-Style Sidebar Properties */}
                        <div style={{ flex: '1 1 40%', padding: '24px', backgroundColor: '#161f30' }}>
                            <h4 style={{ margin: '0 0 16px 0', fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.6px', fontWeight: '700' }}>
                                Issue Properties
                            </h4>

                            {/* Status */}
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '4px' }}>
                                    Status / Column
                                </label>
                                <select
                                    value={form.statusId}
                                    disabled={!canEdit}
                                    title={!canEdit ? "You don't have permission to edit this task" : undefined}
                                    onChange={(e) => setForm({ ...form, statusId: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        backgroundColor: canEdit ? '#1e293b' : 'rgba(255, 255, 255, 0.04)',
                                        fontSize: '13px',
                                        color: '#f8fafc',
                                        cursor: canEdit ? 'pointer' : 'not-allowed'
                                    }}
                                >
                                    {statuses.map(s => (
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
                                    title={!canEdit ? "You don't have permission to edit this task" : undefined}
                                    onChange={(e) => {
                                        const opt = ISSUE_TYPE_OPTIONS.find(i => i.name === e.target.selectedOptions[0].text);
                                        setForm({ ...form, issueTypeId: e.target.value, issueTypeName: opt?.name || 'Task' });
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        backgroundColor: canEdit ? '#1e293b' : 'rgba(255, 255, 255, 0.04)',
                                        fontSize: '13px',
                                        color: '#f8fafc',
                                        cursor: canEdit ? 'pointer' : 'not-allowed'
                                    }}
                                >
                                    {ISSUE_TYPE_OPTIONS.map((item, idx) => (
                                        <option key={idx} value={idx + 1}>{item.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Assignee (Admin only can reassign!) */}
                            <div style={{ marginBottom: '14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>
                                        Assignee
                                    </label>
                                    {!canReassign && (
                                        <span title="Only administrators can reassign tasks to other team members" style={{ fontSize: '10px', color: '#fbbf24', cursor: 'help' }}>
                                            🔒 Admin only
                                        </span>
                                    )}
                                </div>
                                <select
                                    value={form.userId}
                                    disabled={!canReassign}
                                    title={!canReassign ? "Only administrators can reassign tasks to other team members" : undefined}
                                    onChange={(e) => setForm({ ...form, userId: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        backgroundColor: canReassign ? '#1e293b' : 'rgba(255, 255, 255, 0.04)',
                                        fontSize: '13px',
                                        color: '#f8fafc',
                                        cursor: canReassign ? 'pointer' : 'not-allowed'
                                    }}
                                >
                                    <option value="">Unassigned</option>
                                    {members.map(m => (
                                        <option key={m.userId} value={m.userId}>{m.userName} ({m.email})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Priority */}
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '4px' }}>
                                    Priority
                                </label>
                                <select
                                    value={form.priorityId}
                                    disabled={!canEdit}
                                    title={!canEdit ? "You don't have permission to edit this task" : undefined}
                                    onChange={(e) => setForm({ ...form, priorityId: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        backgroundColor: canEdit ? '#1e293b' : 'rgba(255, 255, 255, 0.04)',
                                        fontSize: '13px',
                                        color: '#f8fafc',
                                        cursor: canEdit ? 'pointer' : 'not-allowed'
                                    }}
                                >
                                    {PRIORITY_OPTIONS.map((p, idx) => (
                                        <option key={idx} value={idx + 1}>{p.icon} {p.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Story Points */}
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '4px' }}>
                                    Story Points
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={form.storyPoints}
                                    disabled={!canEdit}
                                    title={!canEdit ? "You don't have permission to edit this task" : undefined}
                                    onChange={(e) => setForm({ ...form, storyPoints: e.target.value })}
                                    placeholder="Estimate (e.g. 1, 2, 3, 5, 8)"
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        backgroundColor: canEdit ? '#1e293b' : 'rgba(255, 255, 255, 0.04)',
                                        fontSize: '13px',
                                        color: '#f8fafc',
                                        boxSizing: 'border-box',
                                        cursor: canEdit ? 'text' : 'not-allowed'
                                    }}
                                />
                            </div>

                            {/* Component */}
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '4px' }}>
                                    Component
                                </label>
                                <select
                                    value={form.componentId}
                                    disabled={!canEdit}
                                    title={!canEdit ? "You don't have permission to edit this task" : undefined}
                                    onChange={(e) => setForm({ ...form, componentId: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        backgroundColor: canEdit ? '#1e293b' : 'rgba(255, 255, 255, 0.04)',
                                        fontSize: '13px',
                                        color: '#f8fafc',
                                        cursor: canEdit ? 'pointer' : 'not-allowed'
                                    }}
                                >
                                    <option value="">None</option>
                                    {components.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Due Date */}
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '4px' }}>
                                    Due Date
                                </label>
                                <input
                                    type="date"
                                    value={form.dueDate}
                                    disabled={!canEdit}
                                    title={!canEdit ? "You don't have permission to edit this task" : undefined}
                                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        backgroundColor: canEdit ? '#1e293b' : 'rgba(255, 255, 255, 0.04)',
                                        fontSize: '13px',
                                        color: '#f8fafc',
                                        boxSizing: 'border-box',
                                        cursor: canEdit ? 'text' : 'not-allowed'
                                    }}
                                />
                            </div>

                            {/* Sprint */}
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '4px' }}>
                                    Sprint
                                </label>
                                <select
                                    value={form.sprintId}
                                    disabled={!canEdit}
                                    title={!canEdit ? "You don't have permission to edit this task" : undefined}
                                    onChange={(e) => setForm({ ...form, sprintId: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        backgroundColor: canEdit ? '#1e293b' : 'rgba(255, 255, 255, 0.04)',
                                        fontSize: '13px',
                                        color: '#f8fafc',
                                        cursor: canEdit ? 'pointer' : 'not-allowed'
                                    }}
                                >
                                    <option value="">Backlog (No Sprint)</option>
                                    {sprintsList.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Epic */}
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#94a3b8', marginBottom: '4px' }}>
                                    Epic
                                </label>
                                <select
                                    value={form.epicId}
                                    disabled={!canEdit}
                                    title={!canEdit ? "You don't have permission to edit this task" : undefined}
                                    onChange={(e) => setForm({ ...form, epicId: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(255, 255, 255, 0.12)',
                                        backgroundColor: canEdit ? '#1e293b' : 'rgba(255, 255, 255, 0.04)',
                                        fontSize: '13px',
                                        color: '#f8fafc',
                                        cursor: canEdit ? 'pointer' : 'not-allowed'
                                    }}
                                >
                                    <option value="">None (No Epic)</option>
                                    {epicsList.map(ep => (
                                        <option key={ep.id} value={ep.id}>⚡ {ep.key} &mdash; {ep.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Audit Dates */}
                            <div style={{
                                marginTop: '24px',
                                paddingTop: '16px',
                                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                                fontSize: '11px',
                                color: '#64748b'
                            }}>
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
    statuses: PropTypes.array.isRequired,
    members: PropTypes.array.isRequired,
    components: PropTypes.array.isRequired,
    allLabels: PropTypes.array.isRequired
};

export default TaskDetailModal;
