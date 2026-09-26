import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import api from '../Api/Axios';

const ISSUE_TYPE_OPTIONS = [
    { name: 'Task', icon: '✅', color: '#4BADE8' },
    { name: 'Bug', icon: '🐞', color: '#E5493A' },
    { name: 'Story', icon: '📖', color: '#63BA3C' },
    { name: 'Epic', icon: '⚡', color: '#904EE2' },
    { name: 'Subtask', icon: '↳', color: '#4BADE8' }
];

const PRIORITY_OPTIONS = [
    { name: 'Highest', icon: '⬆️', color: '#FF5630' },
    { name: 'High', icon: '🔼', color: '#FF7452' },
    { name: 'Medium', icon: '🟰', color: '#FFAB00' },
    { name: 'Low', icon: '🔽', color: '#36B37E' },
    { name: 'Lowest', icon: '⬇️', color: '#0065FF' }
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
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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
                    dueDate: data.dueDate ? data.dueDate.split('T')[0] : '',
                    sprintId: data.sprintId ? String(data.sprintId) : '',
                    epicId: data.epicId ? String(data.epicId) : '',
                    labels: data.labels || [],
                    issueKey: data.issueKey || `TASK-${taskId}`,
                    createdDate: data.createdDate || '',
                    updatedDate: data.updatedDate || ''
                });
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to load task details.');
            } finally {
                setLoading(false);
            }
        };

        if (taskId) {
            fetchDetails();
        }
    }, [taskId]);

    const handleSave = async () => {
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
            setError(err.response?.data?.message || 'Failed to save changes.');
        } finally {
            setSaving(false);
        }
    };

    const handleAddLabel = () => {
        if (!newLabelInput.trim()) return;
        const trimmed = newLabelInput.trim();
        if (!form.labels.includes(trimmed)) {
            setForm({ ...form, labels: [...form.labels, trimmed] });
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

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(9, 30, 66, 0.54)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(3px)',
            padding: '20px'
        }} onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
        }}>
            <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '960px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid #ebecf0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#fafbfc'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '18px' }}>
                            {ISSUE_TYPE_OPTIONS.find(i => i.name === form.issueTypeName)?.icon || '✅'}
                        </span>
                        <span style={{
                            fontSize: '15px',
                            fontWeight: '700',
                            color: '#5e6c84',
                            letterSpacing: '0.4px'
                        }}>
                            {form.issueKey}
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            onClick={handleSave}
                            disabled={saving || loading}
                            style={{
                                backgroundColor: '#0052cc',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '8px 18px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                opacity: saving ? 0.7 : 1
                            }}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>

                        <button
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                fontSize: '20px',
                                cursor: 'pointer',
                                color: '#6b778c',
                                padding: '4px 8px'
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Error alert */}
                {error && (
                    <div style={{
                        padding: '10px 24px',
                        backgroundColor: '#ffebe6',
                        color: '#de350b',
                        fontSize: '13px',
                        fontWeight: '600'
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* Modal Body: Left Content + Right Properties */}
                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#6b778c' }}>
                        Loading issue details...
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        flex: 1,
                        overflowY: 'auto'
                    }}>
                        {/* Left column: Title & Description */}
                        <div style={{ flex: '1 1 60%', padding: '24px', borderRight: '1px solid #ebecf0' }}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b778c', marginBottom: '6px' }}>
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: '#172b4d',
                                        border: '1px solid #dfe1e6',
                                        borderRadius: '4px',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b778c', marginBottom: '6px' }}>
                                    Description
                                </label>
                                <textarea
                                    rows="8"
                                    value={form.descriptions}
                                    onChange={(e) => setForm({ ...form, descriptions: e.target.value })}
                                    placeholder="Add a more detailed description..."
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        fontSize: '14px',
                                        color: '#172b4d',
                                        border: '1px solid #dfe1e6',
                                        borderRadius: '4px',
                                        outline: 'none',
                                        resize: 'vertical',
                                        boxSizing: 'border-box',
                                        fontFamily: 'inherit'
                                    }}
                                />
                            </div>

                            {/* Labels section */}
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b778c', marginBottom: '6px' }}>
                                    Labels
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                                    {form.labels.map((lbl, idx) => (
                                        <span key={idx} style={{
                                            backgroundColor: '#eae6ff',
                                            color: '#403294',
                                            borderRadius: '4px',
                                            padding: '4px 8px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }}>
                                            {lbl}
                                            <span
                                                onClick={() => handleRemoveLabel(lbl)}
                                                style={{ cursor: 'pointer', fontWeight: 'bold' }}
                                                title="Remove label"
                                            >
                                                ✕
                                            </span>
                                        </span>
                                    ))}
                                </div>

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
                                            border: '1px solid #dfe1e6',
                                            borderRadius: '4px',
                                            flex: 1
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddLabel}
                                        style={{
                                            padding: '6px 12px',
                                            backgroundColor: '#f4f5f7',
                                            border: '1px solid #dfe1e6',
                                            borderRadius: '4px',
                                            fontSize: '13px',
                                            fontWeight: '600',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right column: Jira-Style Sidebar Properties */}
                        <div style={{ flex: '1 1 40%', padding: '24px', backgroundColor: '#fafbfc' }}>
                            <h4 style={{ margin: '0 0 16px 0', fontSize: '13px', textTransform: 'uppercase', color: '#5e6c84', letterSpacing: '0.5px' }}>
                                Details
                            </h4>

                            {/* Status */}
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b778c', marginBottom: '4px' }}>
                                    Status / Column
                                </label>
                                <select
                                    value={form.statusId}
                                    onChange={(e) => setForm({ ...form, statusId: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: '4px',
                                        border: '1px solid #dfe1e6',
                                        backgroundColor: '#ffffff',
                                        fontSize: '14px',
                                        color: '#172b4d'
                                    }}
                                >
                                    {statuses.map(s => (
                                        <option key={s.id} value={s.id}>{s.displayName}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Issue Type */}
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b778c', marginBottom: '4px' }}>
                                    Issue Type
                                </label>
                                <select
                                    value={form.issueTypeId}
                                    onChange={(e) => {
                                        const opt = ISSUE_TYPE_OPTIONS.find(i => i.name === e.target.selectedOptions[0].text);
                                        setForm({ ...form, issueTypeId: e.target.value, issueTypeName: opt?.name || 'Task' });
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: '4px',
                                        border: '1px solid #dfe1e6',
                                        backgroundColor: '#ffffff',
                                        fontSize: '14px',
                                        color: '#172b4d'
                                    }}
                                >
                                    {ISSUE_TYPE_OPTIONS.map((item, idx) => (
                                        <option key={idx} value={idx + 1}>{item.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Assignee */}
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b778c', marginBottom: '4px' }}>
                                    Assignee
                                </label>
                                <select
                                    value={form.userId}
                                    onChange={(e) => setForm({ ...form, userId: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: '4px',
                                        border: '1px solid #dfe1e6',
                                        backgroundColor: '#ffffff',
                                        fontSize: '14px',
                                        color: '#172b4d'
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
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b778c', marginBottom: '4px' }}>
                                    Priority
                                </label>
                                <select
                                    value={form.priorityId}
                                    onChange={(e) => setForm({ ...form, priorityId: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: '4px',
                                        border: '1px solid #dfe1e6',
                                        backgroundColor: '#ffffff',
                                        fontSize: '14px',
                                        color: '#172b4d'
                                    }}
                                >
                                    {PRIORITY_OPTIONS.map((p, idx) => (
                                        <option key={idx} value={idx + 1}>{p.icon} {p.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Story Points */}
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b778c', marginBottom: '4px' }}>
                                    Story Points
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={form.storyPoints}
                                    onChange={(e) => setForm({ ...form, storyPoints: e.target.value })}
                                    placeholder="Estimate (e.g. 1, 2, 3, 5, 8)"
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: '4px',
                                        border: '1px solid #dfe1e6',
                                        backgroundColor: '#ffffff',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            {/* Component */}
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b778c', marginBottom: '4px' }}>
                                    Component
                                </label>
                                <select
                                    value={form.componentId}
                                    onChange={(e) => setForm({ ...form, componentId: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: '4px',
                                        border: '1px solid #dfe1e6',
                                        backgroundColor: '#ffffff',
                                        fontSize: '14px',
                                        color: '#172b4d'
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
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b778c', marginBottom: '4px' }}>
                                    Due Date
                                </label>
                                <input
                                    type="date"
                                    value={form.dueDate}
                                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: '4px',
                                        border: '1px solid #dfe1e6',
                                        backgroundColor: '#ffffff',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            {/* Sprint */}
                            <div style={{ marginBottom: '14px' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b778c', marginBottom: '4px' }}>
                                    Sprint
                                </label>
                                <select
                                    value={form.sprintId}
                                    onChange={(e) => setForm({ ...form, sprintId: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: '4px',
                                        border: '1px solid #dfe1e6',
                                        backgroundColor: '#ffffff',
                                        fontSize: '14px',
                                        color: '#172b4d'
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
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b778c', marginBottom: '4px' }}>
                                    Epic
                                </label>
                                <select
                                    value={form.epicId}
                                    onChange={(e) => setForm({ ...form, epicId: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '8px 10px',
                                        borderRadius: '4px',
                                        border: '1px solid #dfe1e6',
                                        backgroundColor: '#ffffff',
                                        fontSize: '14px',
                                        color: '#172b4d'
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
                                borderTop: '1px solid #ebecf0',
                                fontSize: '11px',
                                color: '#8993a4'
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
