import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../Api/Axios';
import BacklogIssueRow from '../components/BacklogIssueRow';
import TaskDetailModal from '../components/TaskDetailModal';
import CreateIssueModal from '../components/CreateIssueModal';
import CreateSprintModal from '../components/CreateSprintModal';
import StartSprintModal from '../components/StartSprintModal';
import CompleteSprintModal from '../components/CompleteSprintModal';
import CreateEpicModal from '../components/CreateEpicModal';
import AppNavbar from '../components/AppNavbar';

const Backlog = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    let userRole = 'User';
    if (token) {
        try {
            const decoded = jwtDecode(token);
            userRole = decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || 'User';
        } catch (e) {
            console.error('Invalid token', e);
        }
    }

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

    // Handle Drag & Drop across Sprints and Backlog
    const handleMoveIssue = async (taskId, targetSprintId, targetPosition) => {
        const previousData = JSON.parse(JSON.stringify(data));

        try {
            // Optimistic update
            await api.put('/backlog/move-issue', {
                taskId,
                targetSprintId,
                targetPosition
            });
            fetchBacklog();
        } catch (err) {
            console.error('Failed to move issue:', err);
            setData(previousData);
            alert(err.response?.data?.message || 'Failed to move issue.');
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
        if (!window.confirm('Delete this sprint? Issues will be moved back to the backlog.')) return;
        try {
            await api.delete(`/sprint/${sprintId}`);
            fetchBacklog();
        } catch (err) {
            alert('Failed to delete sprint.');
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            width: '100vw',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif'
        }}>
            <AppNavbar />
            {/* Top Navigation */}
            <header style={{
                height: '56px',
                backgroundColor: '#1d2125',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '18px' }}>
                        <span>📖</span> Project Backlog & Sprints
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={() => setCreateIssueOpen(true)}
                        style={{
                            backgroundColor: '#0c66e4',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '6px 14px',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: 'pointer'
                        }}
                    >
                        + Create Issue
                    </button>

                    <button
                        onClick={() => setCreateSprintOpen(true)}
                        style={{
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            color: '#ffffff',
                            border: '1px solid rgba(255,255,255,0.3)',
                            borderRadius: '4px',
                            padding: '6px 14px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        + Create Sprint
                    </button>

                    <Link
                        to="/kanban"
                        style={{
                            color: '#ffffff',
                            textDecoration: 'none',
                            fontSize: '13px',
                            fontWeight: '600',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            backgroundColor: '#2c3e50',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        📋 Kanban Board
                    </Link>

                    <Link
                        to="/reports"
                        style={{
                            color: '#ffffff',
                            textDecoration: 'none',
                            fontSize: '13px',
                            fontWeight: '600',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            backgroundColor: '#172b4d',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        📊 Reports
                    </Link>

                    <Link
                        to={userRole === 'Admin' ? '/Admin-dashboard' : '/dashboard'}
                        style={{
                            color: '#ffffff',
                            textDecoration: 'none',
                            fontSize: '13px',
                            fontWeight: '600',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(255,255,255,0.1)'
                        }}
                    >
                        Dashboard
                    </Link>
                </div>
            </header>

            {/* Filter Toolbar */}
            <div style={{
                padding: '12px 24px',
                borderBottom: '1px solid #ebecf0',
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
                        borderRadius: '4px',
                        border: '1px solid #dfe1e6',
                        backgroundColor: showEpicsPanel ? '#eae6ff' : '#f4f5f7',
                        color: showEpicsPanel ? '#403294' : '#42526e',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer'
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
                            padding: '6px 10px 6px 28px',
                            border: '1px solid #dfe1e6',
                            borderRadius: '4px',
                            fontSize: '13px',
                            boxSizing: 'border-box'
                        }}
                    />
                    <span style={{ position: 'absolute', left: '8px', top: '7px', fontSize: '13px', color: '#6b778c' }}>🔍</span>
                </div>

                <select
                    value={selectedAssignee}
                    onChange={(e) => setSelectedAssignee(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #dfe1e6', fontSize: '13px', color: '#42526e' }}
                >
                    <option value="">All Assignees</option>
                    {data.members.map(m => (
                        <option key={m.userId} value={m.userId}>{m.userName}</option>
                    ))}
                </select>

                <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #dfe1e6', fontSize: '13px', color: '#42526e' }}
                >
                    <option value="All">All Priorities</option>
                    {data.priorities.map((p, idx) => (
                        <option key={idx} value={p}>{p}</option>
                    ))}
                </select>

                <select
                    value={selectedIssueType}
                    onChange={(e) => setSelectedIssueType(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #dfe1e6', fontSize: '13px', color: '#42526e' }}
                >
                    <option value="All">All Issue Types</option>
                    {data.issueTypes.map((t, idx) => (
                        <option key={idx} value={t}>{t}</option>
                    ))}
                </select>

                <select
                    value={selectedEpicId}
                    onChange={(e) => setSelectedEpicId(e.target.value)}
                    style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #dfe1e6', fontSize: '13px', color: '#42526e' }}
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
                        style={{ background: 'none', border: 'none', color: '#0052cc', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                    >
                        Clear Filters
                    </button>
                )}

                <div style={{ marginLeft: 'auto' }}>
                    <button
                        onClick={fetchBacklog}
                        style={{ padding: '6px 10px', background: '#f4f5f7', border: '1px solid #dfe1e6', borderRadius: '4px', fontSize: '13px', cursor: 'pointer' }}
                    >
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ padding: '10px 24px', backgroundColor: '#ffebe6', color: '#de350b', fontSize: '13px', fontWeight: '600' }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Main Area: Epics Sidebar + Sprints & Backlog List */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Collapsible Epics Panel */}
                {showEpicsPanel && (
                    <div style={{
                        width: '280px',
                        borderRight: '1px solid #ebecf0',
                        backgroundColor: '#fafbfc',
                        display: 'flex',
                        flexDirection: 'column',
                        overflowY: 'auto'
                    }}>
                        <div style={{
                            padding: '14px 18px',
                            borderBottom: '1px solid #ebecf0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#5e6c84', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Epics
                            </span>
                            <button
                                onClick={() => setCreateEpicOpen(true)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#0052cc',
                                    fontSize: '13px',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                }}
                            >
                                + Create
                            </button>
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
                                            backgroundColor: isSelected ? '#eae6ff' : '#ffffff',
                                            border: `1px solid ${isSelected ? epic.colorHex : '#dfe1e6'}`,
                                            borderLeft: `4px solid ${epic.colorHex}`,
                                            borderRadius: '6px',
                                            marginBottom: '10px',
                                            cursor: 'pointer',
                                            transition: 'box-shadow 0.15s ease'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#5e6c84' }}>{epic.key}</span>
                                            <span style={{
                                                fontSize: '11px',
                                                padding: '2px 6px',
                                                borderRadius: '3px',
                                                backgroundColor: epic.status === 'Done' ? '#e3fcef' : '#deebff',
                                                color: epic.status === 'Done' ? '#006644' : '#0747a6',
                                                fontWeight: '600'
                                            }}>
                                                {epic.status}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#172b4d', marginBottom: '8px' }}>
                                            {epic.name}
                                        </div>

                                        {/* Progress bar */}
                                        <div style={{ height: '6px', backgroundColor: '#ebecf0', borderRadius: '3px', overflow: 'hidden', marginBottom: '6px' }}>
                                            <div style={{ width: `${percent}%`, backgroundColor: epic.colorHex, height: '100%' }} />
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#6b778c', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{epic.completedIssues}/{epic.totalIssues} done</span>
                                            <span>{epic.totalStoryPoints} pts</span>
                                        </div>
                                    </div>
                                );
                            })}

                            {data.epics.length === 0 && (
                                <div style={{ textAlign: 'center', color: '#6b778c', fontSize: '13px', padding: '30px 10px' }}>
                                    No Epics created yet.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Sprints and Backlog List Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#f4f5f7' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#6b778c' }}>Loading Backlog and Sprints...</div>
                    ) : (
                        <>
                            {/* 1. ACTIVE SPRINT SECTION */}
                            {data.activeSprint && (
                                <div style={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: '8px',
                                    boxShadow: '0 1px 3px rgba(9, 30, 66, 0.1)',
                                    marginBottom: '24px',
                                    overflow: 'hidden'
                                }}>
                                    {/* Active Sprint Header */}
                                    <div style={{
                                        padding: '14px 18px',
                                        backgroundColor: '#fafbfc',
                                        borderBottom: '1px solid #ebecf0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: '12px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '16px', fontWeight: '700', color: '#172b4d' }}>
                                                🏃 {data.activeSprint.name}
                                            </span>
                                            <span style={{
                                                backgroundColor: '#e3fcef',
                                                color: '#006644',
                                                borderRadius: '3px',
                                                padding: '2px 8px',
                                                fontSize: '11px',
                                                fontWeight: '700'
                                            }}>
                                                ACTIVE SPRINT
                                            </span>
                                            {data.activeSprint.endDate && (
                                                <span style={{ fontSize: '12px', color: '#5e6c84' }}>
                                                    Ends {new Date(data.activeSprint.endDate).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontSize: '13px', color: '#5e6c84', fontWeight: '600' }}>
                                                {data.activeSprint.totalIssues} issues • {data.activeSprint.totalStoryPoints} pts
                                            </span>
                                            <button
                                                onClick={() => setCompleteSprintModalData(data.activeSprint)}
                                                style={{
                                                    backgroundColor: '#00875a',
                                                    color: '#ffffff',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    padding: '6px 14px',
                                                    fontSize: '13px',
                                                    fontWeight: '700',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Complete Sprint
                                            </button>
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
                                            />
                                        ))}

                                        {data.activeSprint.issues.length === 0 && (
                                            <div style={{ padding: '24px', textAlign: 'center', color: '#8993a4', fontSize: '13px' }}>
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
                                    borderRadius: '8px',
                                    boxShadow: '0 1px 3px rgba(9, 30, 66, 0.1)',
                                    marginBottom: '24px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        padding: '14px 18px',
                                        backgroundColor: '#fafbfc',
                                        borderBottom: '1px solid #ebecf0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        flexWrap: 'wrap',
                                        gap: '12px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ fontSize: '16px', fontWeight: '700', color: '#172b4d' }}>
                                                📦 {sprint.name}
                                            </span>
                                            <span style={{ fontSize: '12px', color: '#6b778c' }}>
                                                {sprint.issues.length} issues • {sprint.totalStoryPoints} pts
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <button
                                                onClick={() => setStartSprintModalData(sprint)}
                                                style={{
                                                    backgroundColor: '#0c66e4',
                                                    color: '#ffffff',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    padding: '6px 14px',
                                                    fontSize: '13px',
                                                    fontWeight: '700',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Start Sprint
                                            </button>

                                            <button
                                                onClick={() => handleDeleteSprint(sprint.id)}
                                                title="Delete sprint"
                                                style={{ background: 'none', border: 'none', color: '#de350b', cursor: 'pointer', fontSize: '16px' }}
                                            >
                                                🗑️
                                            </button>
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
                                            />
                                        ))}

                                        {sprint.issues.length === 0 && (
                                            <div style={{ padding: '24px', textAlign: 'center', color: '#8993a4', fontSize: '13px' }}>
                                                Drag issues here to plan this sprint.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* 3. BACKLOG (UNSCHEDULED ISSUES) */}
                            <div style={{
                                backgroundColor: '#ffffff',
                                borderRadius: '8px',
                                boxShadow: '0 1px 3px rgba(9, 30, 66, 0.1)',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    padding: '14px 18px',
                                    backgroundColor: '#fafbfc',
                                    borderBottom: '1px solid #ebecf0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '16px', fontWeight: '700', color: '#172b4d' }}>
                                            📋 Backlog
                                        </span>
                                        <span style={{ fontSize: '12px', color: '#6b778c' }}>
                                            {data.backlogIssues.length} issues • {data.backlogIssues.reduce((acc, t) => acc + (t.storyPoints || 0), 0)} pts
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => setCreateIssueOpen(true)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#0052cc',
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
                                        />
                                    ))}

                                    {data.backlogIssues.length === 0 && (
                                        <div style={{ padding: '30px', textAlign: 'center', color: '#8993a4', fontSize: '13px' }}>
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
        </div>
    );
};

export default Backlog;
