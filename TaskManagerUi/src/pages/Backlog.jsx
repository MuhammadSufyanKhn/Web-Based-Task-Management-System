import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../Api/Axios';
import BacklogIssueRow from '../components/BacklogIssueRow';
import TaskDetailModal from '../components/TaskDetailModal';
import CreateIssueModal from '../components/CreateIssueModal';
import CreateSprintModal from '../components/CreateSprintModal';
import StartSprintModal from '../components/StartSprintModal';
import CompleteSprintModal from '../components/CompleteSprintModal';
import CreateEpicModal from '../components/CreateEpicModal';
import PermissionModal from '../components/PermissionModal';

const Backlog = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    let userRole = 'User';
    let currentUserId = null;
    if (token) {
        try {
            const decoded = jwtDecode(token);
            userRole = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || 'User';
            currentUserId = parseInt(decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]);
        } catch (e) {
            console.error('Invalid token', e);
        }
    }

    const isAdmin = userRole === 'Admin';

    const [data, setData] = useState({
        activeSprint: null,
        futureSprints: [],
        backlogIssues: [],
        epics: [],
        members: [],
        priorities: [],
        issueTypes: [],
        labels: [],
        components: []
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showEpicsPanel, setShowEpicsPanel] = useState(true);

    // Filters
    const [search, setSearch] = useState('');
    const [selectedAssignee, setSelectedAssignee] = useState('');
    const [selectedPriority, setSelectedPriority] = useState('All');
    const [selectedIssueType, setSelectedIssueType] = useState('All');
    const [selectedLabel, setSelectedLabel] = useState('All');
    const [selectedEpicId, setSelectedEpicId] = useState('');

    // Modals
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [createIssueOpen, setCreateIssueOpen] = useState(false);
    const [createSprintOpen, setCreateSprintOpen] = useState(false);
    const [startSprintModalData, setStartSprintModalData] = useState(null);
    const [completeSprintModalData, setCompleteSprintModalData] = useState(null);
    const [createEpicOpen, setCreateEpicOpen] = useState(false);

    // Permission Modal
    const [permissionModal, setPermissionModal] = useState({
        isOpen: false,
        title: "You can't move this task",
        message: "This task is assigned to another team member.",
        details: "Only the task owner or an administrator can move this task."
    });

    const fetchBacklog = useCallback(async () => {
        try {
            if (!token) {
                navigate('/login');
                return;
            }
            setError(null);

            const params = {};
            if (search.trim()) params.search = search.trim();
            if (selectedAssignee) params.assigneeId = selectedAssignee;
            if (selectedPriority !== 'All') params.priority = selectedPriority;
            if (selectedIssueType !== 'All') params.issueType = selectedIssueType;
            if (selectedLabel !== 'All') params.label = selectedLabel;
            if (selectedEpicId) params.epicId = selectedEpicId;

            const res = await api.get('/backlog', { params });
            setData(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load backlog data.');
        } finally {
            setLoading(false);
        }
    }, [token, navigate, search, selectedAssignee, selectedPriority, selectedIssueType, selectedLabel, selectedEpicId]);

    useEffect(() => {
        fetchBacklog();
    }, [fetchBacklog]);

    const handlePermissionDenied = (info) => {
        setPermissionModal({
            isOpen: true,
            title: info.title || "You can't move this task",
            message: info.message || "This task is assigned to another team member.",
            details: info.details || "Only the task owner or an administrator can move this task."
        });
    };

    // Find issue across all containers
    const findIssue = (taskId) => {
        if (data.activeSprint?.issues) {
            const found = data.activeSprint.issues.find(i => i.taskId === taskId);
            if (found) return found;
        }
        for (const s of data.futureSprints || []) {
            const found = s.issues?.find(i => i.taskId === taskId);
            if (found) return found;
        }
        return data.backlogIssues?.find(i => i.taskId === taskId);
    };

    // Handle Drag & Drop across Sprints and Backlog
    const handleMoveIssue = async (taskId, targetSprintId, targetPosition) => {
        const issue = findIssue(taskId);
        if (issue && !isAdmin && currentUserId && issue.userId !== currentUserId && issue.createdBy !== currentUserId) {
            setPermissionModal({
                isOpen: true,
                title: "You can't move this task",
                message: `This task is assigned to ${issue.userName || 'another team member'}.`,
                details: "Only the task owner or an administrator can move this task."
            });
            return;
        }

        const previousData = JSON.parse(JSON.stringify(data));

        try {
            await api.put('/backlog/move-issue', {
                taskId,
                targetSprintId,
                targetPosition
            });
            fetchBacklog();
        } catch (err) {
            console.error('Failed to move issue:', err);
            setData(previousData);

            if (err.response?.status === 403) {
                setPermissionModal({
                    isOpen: true,
                    title: "You can't move this task",
                    message: "This task is assigned to another team member.",
                    details: err.response.data?.message || "Only the task owner or an administrator can move this task."
                });
            } else {
                alert(err.response?.data?.message || 'Could not move the issue.');
            }
        }
    };

    // Generic drop container handler
    const createDropHandlers = (targetSprintId, currentIssuesCount) => ({
        onDragOver: (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        },
        onDrop: (e) => {
            e.preventDefault();
            const dataStr = e.dataTransfer.getData('text/plain');
            if (!dataStr) return;
            try {
                const parsed = JSON.parse(dataStr);
                handleMoveIssue(parsed.taskId, targetSprintId, currentIssuesCount);
            } catch (err) {
                console.error(err);
            }
        }
    });

    const handleDeleteSprint = async (sprintId) => {
        if (!isAdmin) {
            alert('Only administrators can delete sprints.');
            return;
        }
        if (!window.confirm('Delete this sprint? Issues will be moved back to the backlog.')) return;
        try {
            await api.delete(`/sprint/${sprintId}`);
            fetchBacklog();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete sprint.');
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
                                    overflow: 'hidden',
            backgroundColor: 'transparent',
            color: '#f8fafc',
            fontFamily: 'var(--font-sans)'
        }}>
            {/* Filter Toolbar */}
            <div style={{
                padding: '12px 24px',
                borderBottom: '1px solid #d4e4f8',
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                backgroundColor: '#ffffff'
            }}>
                <button
                    onClick={() => setShowEpicsPanel(!showEpicsPanel)}
                    style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: showEpicsPanel ? '1px solid #0284c7' : '1px solid #d4e4f8',
                        backgroundColor: showEpicsPanel ? '#dbeafe' : '#ffffff',
                        color: showEpicsPanel ? '#0284c7' : '#2b4764',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                    }}
                >
                    ⚡ Epics Panel ({data.epics.length})
                </button>

                <div style={{ position: 'relative', width: '200px' }}>
                    <input
                        type="text"
                        placeholder="Search issues..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '6px 10px 6px 30px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #d4e4f8',
                            borderRadius: '6px',
                            fontSize: '13px',
                            color: '#0d233a',
                            boxSizing: 'border-box'
                        }}
                    />
                    <span style={{ position: 'absolute', left: '8px', top: '7px', fontSize: '13px', color: '#64748b' }}>🔍</span>
                </div>

                <select
                    value={selectedAssignee}
                    onChange={(e) => setSelectedAssignee(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #d4e4f8', fontSize: '13px', color: '#0d233a', backgroundColor: '#ffffff' }}
                >
                    <option value="">All Assignees</option>
                    {data.members.map(m => (
                        <option key={m.userId} value={m.userId}>{m.userName}</option>
                    ))}
                </select>

                <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #d4e4f8', fontSize: '13px', color: '#0d233a', backgroundColor: '#ffffff' }}
                >
                    <option value="All">All Priorities</option>
                    {data.priorities.map((p, idx) => (
                        <option key={idx} value={p}>{p}</option>
                    ))}
                </select>

                <select
                    value={selectedIssueType}
                    onChange={(e) => setSelectedIssueType(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #d4e4f8', fontSize: '13px', color: '#0d233a', backgroundColor: '#ffffff' }}
                >
                    <option value="All">All Issue Types</option>
                    {data.issueTypes.map((t, idx) => (
                        <option key={idx} value={t}>{t}</option>
                    ))}
                </select>

                <select
                    value={selectedEpicId}
                    onChange={(e) => setSelectedEpicId(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #d4e4f8', fontSize: '13px', color: '#0d233a', backgroundColor: '#ffffff' }}
                >
                    <option value="">All Epics</option>
                    {data.epics.map(ep => (
                        <option key={ep.id} value={ep.id}>⚡ {ep.name}</option>
                    ))}
                </select>

                {(search || selectedAssignee || selectedPriority !== 'All' || selectedIssueType !== 'All' || selectedEpicId) && (
                    <button
                        onClick={() => {
                            setSearch('');
                            setSelectedAssignee('');
                            setSelectedPriority('All');
                            setSelectedIssueType('All');
                            setSelectedEpicId('');
                        }}
                        style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                    >
                        Clear Filters
                    </button>
                )}

                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        onClick={fetchBacklog}
                        style={{ padding: '6px 12px', background: '#f0f7ff', border: '1px solid #d4e4f8', borderRadius: '6px', fontSize: '13px', color: '#0284c7', cursor: 'pointer', fontWeight: '600' }}
                    >
                        🔄 Refresh
                    </button>

                    {isAdmin && (
                        <button
                            onClick={() => setCreateSprintOpen(true)}
                            style={{
                                background: '#ffffff',
                                color: '#0284c7',
                                border: '1px solid #0284c7',
                                borderRadius: '6px',
                                padding: '6px 14px',
                                fontSize: '13px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            + Create Sprint
                        </button>
                    )}

                    <button
                        onClick={() => setCreateIssueOpen(true)}
                        style={{
                            background: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 14px',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)'
                        }}
                    >
                        + Create Issue
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ padding: '10px 24px', backgroundColor: 'rgba(239, 68, 68, 0.15)', borderBottom: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '13px', fontWeight: '600' }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Main Area: Epics Sidebar + Sprints & Backlog List */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Collapsible Epics Panel */}
                {showEpicsPanel && (
                    <div style={{
                        width: '280px',
                        borderRight: '1px solid #cbdcf7',
                        backgroundColor: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        overflowY: 'auto'
                    }}>
                        <div style={{
                            padding: '14px 18px',
                            borderBottom: '1px solid #e2edfb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: '#f8fafd'
                        }}>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                                Epics
                            </span>
                            {isAdmin && (
                                <button
                                    onClick={() => setCreateEpicOpen(true)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#1d4ed8',
                                        fontSize: '13px',
                                        fontWeight: '700',
                                        cursor: 'pointer'
                                    }}
                                >
                                    + Create
                                </button>
                            )}
                        </div>

                        <div style={{ padding: '12px' }}>
                            {data.epics.map(epic => {
                                const percent = epic.totalIssues > 0 ? Math.round((epic.completedIssues / epic.totalIssues) * 100) : 0;
                                const isSelected = selectedEpicId === String(epic.id);

                                return (
                                    <div
                                        key={epic.id}
                                        onClick={() => setSelectedEpicId(isSelected ? '' : String(epic.id))}
                                        style={{
                                            padding: '12px',
                                            backgroundColor: isSelected ? '#dbeafe' : '#f8fafd',
                                            border: `1px solid ${isSelected ? '#1d4ed8' : '#cbdcf7'}`,
                                            borderLeft: `4px solid ${epic.colorHex || '#1d4ed8'}`,
                                            borderRadius: '6px',
                                            marginBottom: '10px',
                                            cursor: 'pointer',
                                            transition: 'box-shadow 0.15s ease'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#1d4ed8' }}>{epic.key}</span>
                                            <span style={{
                                                fontSize: '11px',
                                                padding: '2px 6px',
                                                borderRadius: '3px',
                                                backgroundColor: epic.status === 'Done' ? 'rgba(22, 163, 74, 0.1)' : '#dbeafe',
                                                color: epic.status === 'Done' ? '#15803d' : '#1e40af',
                                                fontWeight: '600'
                                            }}>
                                                {epic.status}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
                                            {epic.name}
                                        </div>

                                        {/* Progress bar */}
                                        <div style={{ height: '6px', backgroundColor: '#e2edfb', borderRadius: '3px', overflow: 'hidden', marginBottom: '6px' }}>
                                            <div style={{ width: `${percent}%`, backgroundColor: epic.colorHex || '#1d4ed8', height: '100%' }} />
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{epic.completedIssues}/{epic.totalIssues} done</span>
                                            <span>{epic.totalStoryPoints} pts</span>
                                        </div>
                                    </div>
                                );
                            })}

                            {data.epics.length === 0 && (
                                <div style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', padding: '30px 10px' }}>
                                    No Epics created yet.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Sprints and Backlog List Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#f8fafd' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>Loading Backlog and Sprints...</div>
                    ) : (
                        <>
                            {/* 1. ACTIVE SPRINT SECTION */}
                            {data.activeSprint && (
                                <div style={{
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #cbdcf7',
                                    borderRadius: '10px',
                                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                                    marginBottom: '24px',
                                    overflow: 'hidden'
                                }}>
                                    {/* Active Sprint Header */}
                                    <div style={{
                                        padding: '14px 18px',
                                        backgroundColor: '#eaf2fe',
                                        borderBottom: '1px solid #cbdcf7',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: '12px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '15px', fontWeight: '800', color: '#1e3a8a' }}>
                                                🏃 {data.activeSprint.name}
                                            </span>
                                            <span style={{
                                                backgroundColor: '#1d4ed8',
                                                color: '#ffffff',
                                                borderRadius: '4px',
                                                padding: '2px 8px',
                                                fontSize: '11px',
                                                fontWeight: '700'
                                            }}>
                                                ACTIVE SPRINT
                                            </span>
                                            {data.activeSprint.endDate && (
                                                <span style={{ fontSize: '12px', color: '#475569', fontWeight: '500' }}>
                                                    Ends {new Date(data.activeSprint.endDate).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontSize: '13px', color: '#1e3a8a', fontWeight: '600' }}>
                                                {data.activeSprint.totalIssues} issues • {data.activeSprint.totalStoryPoints} pts
                                            </span>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => setCompleteSprintModalData(data.activeSprint)}
                                                    style={{
                                                        backgroundColor: '#16a34a',
                                                        color: '#ffffff',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        padding: '6px 14px',
                                                        fontSize: '13px',
                                                        fontWeight: '700',
                                                        cursor: 'pointer',
                                                        boxShadow: '0 1px 3px rgba(22, 163, 74, 0.2)'
                                                    }}
                                                >
                                                    Complete Sprint
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Active Sprint Issues */}
                                    <div
                                        {...createDropHandlers(data.activeSprint.id, data.activeSprint.issues.length)}
                                        style={{ minHeight: '60px' }}
                                    >
                                        {data.activeSprint.issues.map((issue, idx) => (
                                            <BacklogIssueRow
                                                key={issue.taskId}
                                                issue={issue}
                                                index={idx}
                                                onIssueClick={(id) => setSelectedTaskId(id)}
                                                onPermissionDenied={handlePermissionDenied}
                                            />
                                        ))}

                                        {data.activeSprint.issues.length === 0 && (
                                            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                                                Plan a sprint by dragging issues here from the backlog.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* 2. FUTURE SPRINTS */}
                            {data.futureSprints.map(sprint => (
                                <div key={sprint.id} style={{
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #cbdcf7',
                                    borderRadius: '10px',
                                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                                    marginBottom: '24px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        padding: '14px 18px',
                                        backgroundColor: '#f8fafd',
                                        borderBottom: '1px solid #cbdcf7',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: '12px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                                                📦 {sprint.name}
                                            </span>
                                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                                                {sprint.issues.length} issues • {sprint.totalStoryPoints} pts
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {isAdmin && (
                                                <>
                                                    <button
                                                        onClick={() => setStartSprintModalData(sprint)}
                                                        style={{
                                                            backgroundColor: '#1d4ed8',
                                                            color: '#ffffff',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            padding: '6px 14px',
                                                            fontSize: '13px',
                                                            fontWeight: '700',
                                                            cursor: 'pointer',
                                                            boxShadow: '0 1px 3px rgba(29, 78, 216, 0.2)'
                                                        }}
                                                    >
                                                        Start Sprint
                                                    </button>

                                                    <button
                                                        onClick={() => handleDeleteSprint(sprint.id)}
                                                        title="Delete sprint"
                                                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '16px' }}
                                                    >
                                                        🗑️
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Future Sprint Issues List */}
                                    <div
                                        {...createDropHandlers(sprint.id, sprint.issues.length)}
                                        style={{ minHeight: '60px' }}
                                    >
                                        {sprint.issues.map((issue, idx) => (
                                            <BacklogIssueRow
                                                key={issue.taskId}
                                                issue={issue}
                                                index={idx}
                                                onIssueClick={(id) => setSelectedTaskId(id)}
                                                onPermissionDenied={handlePermissionDenied}
                                            />
                                        ))}

                                        {sprint.issues.length === 0 && (
                                            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                                                Drag issues here to plan this sprint.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* 3. BACKLOG (UNSCHEDULED ISSUES) */}
                            <div style={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #cbdcf7',
                                borderRadius: '10px',
                                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    padding: '14px 18px',
                                    backgroundColor: '#f8fafd',
                                    borderBottom: '1px solid #cbdcf7',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>
                                            📋 Backlog
                                        </span>
                                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                                            {data.backlogIssues.length} issues • {data.backlogIssues.reduce((acc, t) => acc + (t.storyPoints || 0), 0)} pts
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => setCreateIssueOpen(true)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#1d4ed8',
                                            fontWeight: '700',
                                            fontSize: '13px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        + Create Issue
                                    </button>
                                </div>

                                <div
                                    {...createDropHandlers(null, data.backlogIssues.length)}
                                    style={{ minHeight: '80px' }}
                                >
                                    {data.backlogIssues.map((issue, idx) => (
                                        <BacklogIssueRow
                                            key={issue.taskId}
                                            issue={issue}
                                            index={idx}
                                            onIssueClick={(id) => setSelectedTaskId(id)}
                                            onPermissionDenied={handlePermissionDenied}
                                        />
                                    ))}

                                    {data.backlogIssues.length === 0 && (
                                        <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                                            Your backlog is empty. Click "+ Create Issue" to add work items.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Task Detail Modal */}
            {selectedTaskId && (
                <TaskDetailModal
                    taskId={selectedTaskId}
                    onClose={() => setSelectedTaskId(null)}
                    onTaskUpdated={fetchBacklog}
                    statuses={[]}
                    members={data.members}
                    components={data.components.map((c, i) => ({ id: i + 1, name: c }))}
                    allLabels={data.labels}
                />
            )}

            {/* Create Issue Modal */}
            {createIssueOpen && (
                <CreateIssueModal
                    initialStatusId={null}
                    statuses={[{ id: 1, displayName: 'To Do' }]}
                    members={data.members}
                    components={data.components.map((c, i) => ({ id: i + 1, name: c }))}
                    onClose={() => setCreateIssueOpen(false)}
                    onIssueCreated={fetchBacklog}
                />
            )}

            {/* Create Sprint Modal */}
            {createSprintOpen && (
                <CreateSprintModal
                    defaultSprintNumber={(data.futureSprints.length || 0) + (data.activeSprint ? 2 : 1)}
                    onClose={() => setCreateSprintOpen(false)}
                    onSprintCreated={fetchBacklog}
                />
            )}

            {/* Start Sprint Modal */}
            {startSprintModalData && (
                <StartSprintModal
                    sprint={startSprintModalData}
                    onClose={() => setStartSprintModalData(null)}
                    onSprintStarted={fetchBacklog}
                />
            )}

            {/* Complete Sprint Modal */}
            {completeSprintModalData && (
                <CompleteSprintModal
                    sprint={completeSprintModalData}
                    futureSprints={data.futureSprints}
                    onClose={() => setCompleteSprintModalData(null)}
                    onSprintCompleted={fetchBacklog}
                />
            )}

            {/* Create Epic Modal */}
            {createEpicOpen && (
                <CreateEpicModal
                    onClose={() => setCreateEpicOpen(false)}
                    onEpicCreated={fetchBacklog}
                />
            )}

            {/* Permission Modal */}
            <PermissionModal
                isOpen={permissionModal.isOpen}
                title={permissionModal.title}
                message={permissionModal.message}
                details={permissionModal.details}
                onClose={() => setPermissionModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default Backlog;


