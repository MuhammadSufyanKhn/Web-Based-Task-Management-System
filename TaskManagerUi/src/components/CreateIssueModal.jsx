import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { jwtDecode } from 'jwt-decode';
import api from '../Api/Axios';

const ISSUE_TYPES = [
    { name: 'Task', icon: '✅' },
    { name: 'Bug', icon: '🐞' },
    { name: 'Story', icon: '📖' },
    { name: 'Epic', icon: '⚡' },
    { name: 'Subtask', icon: '↳' }
];

const PRIORITIES = [
    { name: 'Highest', icon: '⬆️' },
    { name: 'High', icon: '🔼' },
    { name: 'Medium', icon: '🟰' },
    { name: 'Low', icon: '🔽' },
    { name: 'Lowest', icon: '⬇️' }
];

const CreateIssueModal = ({
    initialStatusId,
    initialSprintId = null,
    initialEpicId = null,
    initialDueDate = '',
    parentTaskId = null,
    statuses = [],
    members = [],
    components = [],
    sprints: propSprints = null,
    epics: propEpics = null,
    onClose,
    onIssueCreated
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
            // Mock environments
        }
    }

    const [title, setTitle] = useState('');
    const [descriptions, setDescriptions] = useState('');
    const [statusId, setStatusId] = useState(initialStatusId || (statuses[0]?.id || ''));
    const [issueTypeId, setIssueTypeId] = useState(parentTaskId ? '5' : '1'); // 5 = Subtask
    const [priorityId, setPriorityId] = useState('3'); // Medium
    const [userId, setUserId] = useState(isAdmin ? '' : (currentUserId ? String(currentUserId) : ''));
    const [componentId, setComponentId] = useState('');
    const [storyPoints, setStoryPoints] = useState('');
    const [originalEstimateHours, setOriginalEstimateHours] = useState('');
    const [dueDate, setDueDate] = useState(initialDueDate || '');
    const [sprintId, setSprintId] = useState(initialSprintId ? String(initialSprintId) : '');
    const [epicId, setEpicId] = useState(initialEpicId ? String(initialEpicId) : '');
    const [sprintsList, setSprintsList] = useState(propSprints || []);
    const [epicsList, setEpicsList] = useState(propEpics || []);
    const [labelInput, setLabelInput] = useState('');
    const [labels, setLabels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    React.useEffect(() => {
        if (!propSprints) {
            api.get('/sprint/all')
                .then(res => setSprintsList(res.data || []))
                .catch(err => console.error('Failed to load sprints for modal', err));
        }
        if (!propEpics) {
            api.get('/epic')
                .then(res => setEpicsList(res.data || []))
                .catch(err => console.error('Failed to load epics for modal', err));
        }
    }, [propSprints, propEpics]);

    const handleAddLabel = () => {
        if (!labelInput.trim()) return;
        const trimmed = labelInput.trim();
        if (!labels.includes(trimmed)) {
            setLabels([...labels, trimmed]);
        }
        setLabelInput('');
    };

    const handleRemoveLabel = (lbl) => {
        setLabels(labels.filter(l => l !== lbl));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            setError('Please enter an issue title.');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const payload = {
                title: title.trim(),
                descriptions: descriptions.trim(),
                statusId: statusId ? parseInt(statusId) : null,
                issueTypeId: issueTypeId ? parseInt(issueTypeId) : (parentTaskId ? 5 : 1),
                priorityId: priorityId ? parseInt(priorityId) : 3,
                userId: userId ? parseInt(userId) : (currentUserId || null),
                componentId: componentId ? parseInt(componentId) : null,
                storyPoints: storyPoints !== '' ? parseInt(storyPoints) : null,
                dueDate: dueDate ? new Date(dueDate).toISOString() : null,
                labels,
                sprintId: sprintId ? parseInt(sprintId) : null,
                epicId: epicId ? parseInt(epicId) : null,
                parentTaskId: parentTaskId ? parseInt(parentTaskId) : null,
                originalEstimateMinutes: originalEstimateHours !== '' && !isNaN(parseFloat(originalEstimateHours))
                    ? Math.round(parseFloat(originalEstimateHours) * 60)
                    : null
            };

            await api.post('/kanban/task', payload);
            if (onIssueCreated) onIssueCreated();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || err.userFriendlyMessage || 'Failed to create issue.');
        } finally {
            setLoading(false);
        }
    };

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
                maxWidth: '680px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                overflow: 'hidden',
                color: '#f8fafc'
            }}>
                <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#161f30'
                }}>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>✨</span> Create Issue
                    </h3>
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

                <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                    {parentTaskId && (
                        <div style={{
                            padding: '10px 14px',
                            backgroundColor: 'rgba(99, 102, 241, 0.15)',
                            border: '1px solid rgba(99, 102, 241, 0.35)',
                            borderRadius: '8px',
                            color: '#c7d2fe',
                            fontSize: '13px',
                            fontWeight: '600',
                            marginBottom: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}>
                            <span style={{ fontSize: '16px' }}>↳</span>
                            <span>Creating <strong>Subtask</strong> linked to Parent Task #{parentTaskId}</span>
                        </div>
                    )}

                    {/* Issue Type & Status row */}
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '4px' }}>
                                Issue Type
                            </label>
                            <select
                                value={issueTypeId}
                                onChange={(e) => setIssueTypeId(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    borderRadius: '6px',
                                    backgroundColor: '#1e293b',
                                    color: '#f8fafc',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    fontSize: '13px',
                                    boxSizing: 'border-box'
                                }}
                            >
                                {ISSUE_TYPES.map((t, idx) => (
                                    <option key={idx} value={idx + 1}>{t.icon} {t.name}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '4px' }}>
                                Column / Status
                            </label>
                            <select
                                value={statusId}
                                onChange={(e) => setStatusId(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    borderRadius: '6px',
                                    backgroundColor: '#1e293b',
                                    color: '#f8fafc',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    fontSize: '13px',
                                    boxSizing: 'border-box'
                                }}
                            >
                                {statuses.map(s => (
                                    <option key={s.id} value={s.id}>{s.displayName}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Title */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '4px' }}>
                            Summary / Title <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="What needs to be done?"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: '6px',
                                backgroundColor: '#1e293b',
                                color: '#f8fafc',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* Description */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '4px' }}>
                            Description
                        </label>
                        <textarea
                            rows="4"
                            placeholder="Add issue context or acceptance criteria..."
                            value={descriptions}
                            onChange={(e) => setDescriptions(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: '6px',
                                backgroundColor: '#1e293b',
                                color: '#f8fafc',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                fontSize: '13px',
                                boxSizing: 'border-box',
                                fontFamily: 'inherit'
                            }}
                        />
                    </div>

                    {/* Assignee & Priority row */}
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <label style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8' }}>
                                    Assignee
                                </label>
                                {!isAdmin && (
                                    <span title="Only administrators can assign tasks to other team members" style={{ fontSize: '10px', color: '#fbbf24', cursor: 'help' }}>
                                        🔒 Assigned to you
                                    </span>
                                )}
                            </div>
                            <select
                                value={userId}
                                disabled={!isAdmin}
                                title={!isAdmin ? "Only administrators can assign tasks to other team members" : undefined}
                                onChange={(e) => setUserId(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    borderRadius: '6px',
                                    backgroundColor: isAdmin ? '#1e293b' : 'rgba(255, 255, 255, 0.04)',
                                    color: '#f8fafc',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    fontSize: '13px',
                                    boxSizing: 'border-box',
                                    cursor: isAdmin ? 'pointer' : 'not-allowed'
                                }}
                            >
                                <option value="">Assign to me (default)</option>
                                {members.map(m => (
                                    <option key={m.userId} value={m.userId}>{m.userName} ({m.email})</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '4px' }}>
                                Priority
                            </label>
                            <select
                                value={priorityId}
                                onChange={(e) => setPriorityId(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    borderRadius: '6px',
                                    backgroundColor: '#1e293b',
                                    color: '#f8fafc',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    fontSize: '13px',
                                    boxSizing: 'border-box'
                                }}
                            >
                                {PRIORITIES.map((p, idx) => (
                                    <option key={idx} value={idx + 1}>{p.icon} {p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Component, Story Points, Original Estimate & Due Date row */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.9fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '4px' }}>
                                Component
                            </label>
                            <select
                                value={componentId}
                                onChange={(e) => setComponentId(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    borderRadius: '6px',
                                    backgroundColor: '#1e293b',
                                    color: '#f8fafc',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    fontSize: '13px',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <option value="">None</option>
                                {components.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '4px' }}>
                                Story Points
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="Pts"
                                value={storyPoints}
                                onChange={(e) => setStoryPoints(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    borderRadius: '6px',
                                    backgroundColor: '#1e293b',
                                    color: '#f8fafc',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    fontSize: '13px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '4px' }}>
                                Estimate (hrs)
                            </label>
                            <input
                                type="number"
                                step="0.5"
                                min="0"
                                placeholder="e.g. 4.5"
                                value={originalEstimateHours}
                                onChange={(e) => setOriginalEstimateHours(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    borderRadius: '6px',
                                    backgroundColor: '#1e293b',
                                    color: '#f8fafc',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    fontSize: '13px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '4px' }}>
                                Due Date
                            </label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    borderRadius: '6px',
                                    backgroundColor: '#1e293b',
                                    color: '#f8fafc',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    fontSize: '13px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    </div>

                    {/* Sprint & Epic row */}
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '4px' }}>
                                Sprint
                            </label>
                            <select
                                value={sprintId}
                                onChange={(e) => setSprintId(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    borderRadius: '6px',
                                    backgroundColor: '#1e293b',
                                    color: '#f8fafc',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    fontSize: '13px',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <option value="">Backlog (No Sprint)</option>
                                {sprintsList.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({s.status})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '4px' }}>
                                Epic
                            </label>
                            <select
                                value={epicId}
                                onChange={(e) => setEpicId(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    borderRadius: '6px',
                                    backgroundColor: '#1e293b',
                                    color: '#f8fafc',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    fontSize: '13px',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <option value="">None (No Epic)</option>
                                {epicsList.map(ep => (
                                    <option key={ep.id} value={ep.id}>
                                        ⚡ {ep.key} &mdash; {ep.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Labels */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '4px' }}>
                            Labels
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                            {labels.map((lbl, idx) => (
                                <span key={idx} style={{
                                    backgroundColor: 'rgba(139, 92, 246, 0.15)',
                                    color: '#c4b5fd',
                                    border: '1px solid rgba(139, 92, 246, 0.25)',
                                    borderRadius: '4px',
                                    padding: '2px 8px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    {lbl}
                                    <span onClick={() => handleRemoveLabel(lbl)} style={{ cursor: 'pointer' }}>✕</span>
                                </span>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                placeholder="Add label and press Enter..."
                                value={labelInput}
                                onChange={(e) => setLabelInput(e.target.value)}
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
                    </div>

                    {/* Footer Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                borderRadius: '6px',
                                color: '#94a3b8',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '8px 20px',
                                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                boxShadow: '0 2px 6px rgba(99, 102, 241, 0.35)',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

CreateIssueModal.propTypes = {
    initialStatusId: PropTypes.number,
    initialSprintId: PropTypes.number,
    initialEpicId: PropTypes.number,
    initialDueDate: PropTypes.string,
    parentTaskId: PropTypes.number,
    statuses: PropTypes.array.isRequired,
    members: PropTypes.array.isRequired,
    components: PropTypes.array.isRequired,
    sprints: PropTypes.array,
    epics: PropTypes.array,
    onClose: PropTypes.func.isRequired,
    onIssueCreated: PropTypes.func.isRequired
};

export default CreateIssueModal;
