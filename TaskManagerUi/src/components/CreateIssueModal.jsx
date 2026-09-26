import React, { useState } from 'react';
import PropTypes from 'prop-types';
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
    statuses = [],
    members = [],
    components = [],
    sprints: propSprints = null,
    epics: propEpics = null,
    onClose,
    onIssueCreated
}) => {
    const [title, setTitle] = useState('');
    const [descriptions, setDescriptions] = useState('');
    const [statusId, setStatusId] = useState(initialStatusId || (statuses[0]?.id || ''));
    const [issueTypeId, setIssueTypeId] = useState('1'); // Task
    const [priorityId, setPriorityId] = useState('3'); // Medium
    const [userId, setUserId] = useState('');
    const [componentId, setComponentId] = useState('');
    const [storyPoints, setStoryPoints] = useState('');
    const [dueDate, setDueDate] = useState('');
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
                issueTypeId: issueTypeId ? parseInt(issueTypeId) : 1,
                priorityId: priorityId ? parseInt(priorityId) : 3,
                userId: userId ? parseInt(userId) : null,
                componentId: componentId ? parseInt(componentId) : null,
                storyPoints: storyPoints !== '' ? parseInt(storyPoints) : null,
                dueDate: dueDate ? new Date(dueDate).toISOString() : null,
                labels,
                sprintId: sprintId ? parseInt(sprintId) : null,
                epicId: epicId ? parseInt(epicId) : null
            };

            await api.post('/kanban/task', payload);
            if (onIssueCreated) onIssueCreated();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create issue.');
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
                maxWidth: '680px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                overflow: 'hidden'
            }}>
                <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid #ebecf0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#fafbfc'
                }}>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#172b4d' }}>
                        ✨ Create Issue
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            fontSize: '20px',
                            cursor: 'pointer',
                            color: '#6b778c'
                        }}
                    >
                        ✕
                    </button>
                </div>

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

                <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                    {/* Issue Type & Status row */}
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b778c', marginBottom: '4px' }}>
                                Issue Type
                            </label>
                            <select
                                value={issueTypeId}
                                onChange={(e) => setIssueTypeId(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    borderRadius: '4px',
                                    border: '1px solid #dfe1e6',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                }}
                            >
                                {ISSUE_TYPES.map((t, idx) => (
                                    <option key={idx} value={idx + 1}>{t.icon} {t.name}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b778c', marginBottom: '4px' }}>
                                Column / Status
                            </label>
                            <select
                                value={statusId}
                                onChange={(e) => setStatusId(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    borderRadius: '4px',
                                    border: '1px solid #dfe1e6',
                                    fontSize: '14px',
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
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b778c', marginBottom: '4px' }}>
                            Summary / Title <span style={{ color: 'red' }}>*</span>
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
                                borderRadius: '4px',
                                border: '1px solid #dfe1e6',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* Description */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b778c', marginBottom: '4px' }}>
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
                                borderRadius: '4px',
                                border: '1px solid #dfe1e6',
                                fontSize: '14px',
                                boxSizing: 'border-box',
                                fontFamily: 'inherit'
                            }}
                        />
                    </div>

                    {/* Assignee & Priority row */}
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b778c', marginBottom: '4px' }}>
                                Assignee
                            </label>
                            <select
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    borderRadius: '4px',
                                    border: '1px solid #dfe1e6',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <option value="">Assign to me (default)</option>
                                {members.map(m => (
                                    <option key={m.userId} value={m.userId}>{m.userName} ({m.email})</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b778c', marginBottom: '4px' }}>
                                Priority
                            </label>
                            <select
                                value={priorityId}
                                onChange={(e) => setPriorityId(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    borderRadius: '4px',
                                    border: '1px solid #dfe1e6',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                }}
                            >
                                {PRIORITIES.map((p, idx) => (
                                    <option key={idx} value={idx + 1}>{p.icon} {p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Component, Story Points & Due Date row */}
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b778c', marginBottom: '4px' }}>
                                Component
                            </label>
                            <select
                                value={componentId}
                                onChange={(e) => setComponentId(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    borderRadius: '4px',
                                    border: '1px solid #dfe1e6',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <option value="">None</option>
                                {components.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b778c', marginBottom: '4px' }}>
                                Story Points
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                placeholder="Estimate"
                                value={storyPoints}
                                onChange={(e) => setStoryPoints(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    borderRadius: '4px',
                                    border: '1px solid #dfe1e6',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b778c', marginBottom: '4px' }}>
                                Due Date
                            </label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    borderRadius: '4px',
                                    border: '1px solid #dfe1e6',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    </div>

                    {/* Sprint & Epic row */}
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b778c', marginBottom: '4px' }}>
                                Sprint
                            </label>
                            <select
                                value={sprintId}
                                onChange={(e) => setSprintId(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    borderRadius: '4px',
                                    border: '1px solid #dfe1e6',
                                    fontSize: '14px',
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
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b778c', marginBottom: '4px' }}>
                                Epic
                            </label>
                            <select
                                value={epicId}
                                onChange={(e) => setEpicId(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    borderRadius: '4px',
                                    border: '1px solid #dfe1e6',
                                    fontSize: '14px',
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
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b778c', marginBottom: '4px' }}>
                            Labels
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                            {labels.map((lbl, idx) => (
                                <span key={idx} style={{
                                    backgroundColor: '#eae6ff',
                                    color: '#403294',
                                    borderRadius: '3px',
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

                    {/* Footer Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #ebecf0', paddingTop: '16px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: 'transparent',
                                border: '1px solid #dfe1e6',
                                borderRadius: '4px',
                                color: '#42526e',
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
                                backgroundColor: '#0052cc',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '4px',
                                fontWeight: '600',
                                cursor: 'pointer',
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
    statuses: PropTypes.array.isRequired,
    members: PropTypes.array.isRequired,
    components: PropTypes.array.isRequired,
    onClose: PropTypes.func.isRequired,
    onIssueCreated: PropTypes.func.isRequired
};

export default CreateIssueModal;
