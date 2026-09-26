import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../Api/Axios';
import KanbanColumn from '../components/KanbanColumn';
import TaskDetailModal from '../components/TaskDetailModal';
import CreateIssueModal from '../components/CreateIssueModal';
import PermissionModal from '../components/PermissionModal';

const KanbanBoard = () => {
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

    const [boardData, setBoardData] = useState({
        columns: [],
        members: [],
        priorities: [],
        issueTypes: [],
        labels: []
    });
    const [componentsList, setComponentsList] = useState([]);
    const [sprintsList, setSprintsList] = useState([]);
    const [activeSprint, setActiveSprint] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [search, setSearch] = useState('');
    const [selectedAssignee, setSelectedAssignee] = useState('');
    const [selectedPriority, setSelectedPriority] = useState('All');
    const [selectedIssueType, setSelectedIssueType] = useState('All');
    const [selectedLabel, setSelectedLabel] = useState('All');
    const [selectedSprint, setSelectedSprint] = useState('all');
    const [onlyMyTasks, setOnlyMyTasks] = useState(false);

    // Modals
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createModalStatusId, setCreateModalStatusId] = useState(null);

    // Permission Modal state
    const [permissionModal, setPermissionModal] = useState({
        isOpen: false,
        title: "You can't move this task",
        message: "This task is assigned to another team member.",
        details: "Only the task owner or an administrator can move this task."
    });

    const fetchBoard = useCallback(async () => {
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
            if (onlyMyTasks) params.onlyMyTasks = true;
            if (selectedSprint === 'active') {
                params.activeSprintOnly = true;
            } else if (selectedSprint && selectedSprint !== 'all') {
                params.sprintId = selectedSprint;
            }

            const res = await api.get('/kanban/board', { params });
            setBoardData(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load Kanban board.');
        } finally {
            setLoading(false);
        }
    }, [token, navigate, search, selectedAssignee, selectedPriority, selectedIssueType, selectedLabel, selectedSprint, onlyMyTasks]);

    // Fetch auxiliary data (components & sprints)
    useEffect(() => {
        const fetchAuxiliaryData = async () => {
            try {
                const [compRes, sprintsRes, activeRes] = await Promise.allSettled([
                    api.get('/projectconfig/components'),
                    api.get('/sprint/all'),
                    api.get('/sprint/active')
                ]);
                if (compRes.status === 'fulfilled') setComponentsList(compRes.value.data || []);
                if (sprintsRes.status === 'fulfilled') setSprintsList(sprintsRes.value.data || []);
                if (activeRes.status === 'fulfilled') setActiveSprint(activeRes.value.data || null);
            } catch (err) {
                console.error('Failed to load auxiliary board data', err);
            }
        };
        fetchAuxiliaryData();
    }, []);

    useEffect(() => {
        fetchBoard();
    }, [fetchBoard]);

    // Permission denied callback
    const handlePermissionDenied = (info) => {
        setPermissionModal({
            isOpen: true,
            title: info.title || "You can't move this task",
            message: info.message || "This task is assigned to another team member.",
            details: info.details || "Only the task owner or an administrator can move this task."
        });
    };

    // Drag-and-drop Card Move handler
    const handleCardMove = async (taskId, targetStatusId, targetPosition) => {
        // Find the card being moved
        let targetCard = null;
        for (const col of boardData.columns) {
            const found = col.cards.find(c => c.taskId === taskId);
            if (found) {
                targetCard = found;
                break;
            }
        }

        // Permission check on frontend before move
        if (targetCard && !isAdmin && currentUserId && targetCard.userId !== currentUserId && targetCard.createdBy !== currentUserId) {
            setPermissionModal({
                isOpen: true,
                title: "You can't move this task",
                message: `This task is assigned to ${targetCard.userName || 'another team member'}.`,
                details: "Only the task owner or an administrator can move this task."
            });
            return;
        }

        const previousColumns = JSON.parse(JSON.stringify(boardData.columns));

        // Optimistic UI update
        let movedCard = null;
        const newColumns = boardData.columns.map(col => {
            const cardIdx = col.cards.findIndex(c => c.taskId === taskId);
            if (cardIdx !== -1) {
                movedCard = { ...col.cards[cardIdx], statusId: targetStatusId };
                const filtered = [...col.cards];
                filtered.splice(cardIdx, 1);
                return { ...col, cards: filtered };
            }
            return col;
        });

        if (movedCard) {
            const targetColIdx = newColumns.findIndex(c => c.id === targetStatusId);
            if (targetColIdx !== -1) {
                const targetCards = [...newColumns[targetColIdx].cards];
                const insertPos = Math.min(Math.max(0, targetPosition), targetCards.length);
                movedCard.statusDisplayName = newColumns[targetColIdx].displayName;
                movedCard.statusName = newColumns[targetColIdx].name;
                targetCards.splice(insertPos, 0, movedCard);
                newColumns[targetColIdx].cards = targetCards;
            }
        }

        setBoardData(prev => ({ ...prev, columns: newColumns }));

        try {
            await api.put('/kanban/move-card', {
                taskId,
                targetStatusId,
                targetPosition
            });
        } catch (err) {
            // Rollback on failure
            console.error('Move failed:', err);
            setBoardData(prev => ({ ...prev, columns: previousColumns }));

            if (err.response?.status === 403) {
                setPermissionModal({
                    isOpen: true,
                    title: "You can't move this task",
                    message: "This task is assigned to another team member.",
                    details: err.response.data?.message || "Only the task owner or an administrator can move this task."
                });
            } else {
                alert(err.response?.data?.message || 'Could not move the issue. Please check workflow rules.');
            }
        }
    };

    const handleQuickCreate = (statusId) => {
        setCreateModalStatusId(statusId);
        setCreateModalOpen(true);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, overflow: 'hidden' }}>
            {/* Filter and Control Toolbar */}
            <div className="toolbar" style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #d4e4f8', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {/* Search */}
                <div style={{ position: 'relative', width: '220px' }}>
                    <input
                        type="text"
                        placeholder="Search issues..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '7px 12px 7px 32px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #d4e4f8',
                            borderRadius: '6px',
                            fontSize: '13px',
                            color: '#0d233a',
                            outline: 'none',
                            boxSizing: 'border-box'
                        }}
                    />
                    <span style={{ position: 'absolute', left: '10px', top: '7px', fontSize: '13px', color: '#64748b' }}>
                        🔍
                    </span>
                </div>

                {/* Only My Tasks toggle */}
                <button
                    onClick={() => setOnlyMyTasks(!onlyMyTasks)}
                    style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: onlyMyTasks ? '1px solid #0284c7' : '1px solid #d4e4f8',
                        backgroundColor: onlyMyTasks ? '#dbeafe' : '#ffffff',
                        color: onlyMyTasks ? '#0284c7' : '#2b4764',
                        fontWeight: '600',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                    }}
                >
                    <span>👤</span> Only My Issues
                </button>

                {/* Assignee Filter */}
                <select
                    value={selectedAssignee}
                    onChange={(e) => setSelectedAssignee(e.target.value)}
                    style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #d4e4f8',
                        fontSize: '13px',
                        color: '#0d233a',
                        backgroundColor: '#ffffff'
                    }}
                >
                    <option value="">All Assignees</option>
                    {boardData.members.map(m => (
                        <option key={m.userId} value={m.userId}>{m.userName}</option>
                    ))}
                </select>

                {/* Priority Filter */}
                <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #d4e4f8',
                        fontSize: '13px',
                        color: '#0d233a',
                        backgroundColor: '#ffffff'
                    }}
                >
                    <option value="All">All Priorities</option>
                    {boardData.priorities.map((p, idx) => (
                        <option key={idx} value={p}>{p}</option>
                    ))}
                </select>

                {/* Issue Type Filter */}
                <select
                    value={selectedIssueType}
                    onChange={(e) => setSelectedIssueType(e.target.value)}
                    style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #d4e4f8',
                        fontSize: '13px',
                        color: '#0d233a',
                        backgroundColor: '#ffffff'
                    }}
                >
                    <option value="All">All Issue Types</option>
                    {boardData.issueTypes.map((t, idx) => (
                        <option key={idx} value={t}>{t}</option>
                    ))}
                </select>

                {/* Label Filter */}
                <select
                    value={selectedLabel}
                    onChange={(e) => setSelectedLabel(e.target.value)}
                    style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #d4e4f8',
                        fontSize: '13px',
                        color: '#0d233a',
                        backgroundColor: '#ffffff'
                    }}
                >
                    <option value="All">All Labels</option>
                    {boardData.labels.map((l, idx) => (
                        <option key={idx} value={l}>{l}</option>
                    ))}
                </select>

                {/* Sprint Filter */}
                <select
                    value={selectedSprint}
                    onChange={(e) => setSelectedSprint(e.target.value)}
                    style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: selectedSprint !== 'all' ? '1px solid #0284c7' : '1px solid #d4e4f8',
                        fontSize: '13px',
                        color: selectedSprint !== 'all' ? '#0284c7' : '#0d233a',
                        backgroundColor: selectedSprint !== 'all' ? '#e0f2fe' : '#ffffff',
                        fontWeight: selectedSprint !== 'all' ? '600' : 'normal'
                    }}
                >
                    <option value="all">All Sprints & Backlog</option>
                    <option value="active">⚡ Active Sprint Only</option>
                    {sprintsList.map(s => (
                        <option key={s.id} value={s.id}>
                            {s.name} ({s.status})
                        </option>
                    ))}
                </select>

                {/* Clear filters button if any filter is active */}
                {(search || selectedAssignee || selectedPriority !== 'All' || selectedIssueType !== 'All' || selectedLabel !== 'All' || selectedSprint !== 'all' || onlyMyTasks) && (
                    <button
                        onClick={() => {
                            setSearch('');
                            setSelectedAssignee('');
                            setSelectedPriority('All');
                            setSelectedIssueType('All');
                            setSelectedLabel('All');
                            setSelectedSprint('all');
                            setOnlyMyTasks(false);
                        }}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#0284c7',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            padding: '4px 8px'
                        }}
                    >
                        ✕ Clear
                    </button>
                )}

                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        onClick={fetchBoard}
                        title="Refresh board"
                        style={{
                            background: '#f0f7ff',
                            border: '1px solid #d4e4f8',
                            borderRadius: '6px',
                            padding: '6px 12px',
                            fontSize: '13px',
                            cursor: 'pointer',
                            color: '#0284c7',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: '600',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#dbeafe'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f0f7ff'; }}
                    >
                        <span>🔄</span> Refresh
                    </button>

                    <button
                        onClick={() => {
                            setCreateModalStatusId(boardData.columns[0]?.id || null);
                            setCreateModalOpen(true);
                        }}
                        style={{
                            background: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 14px',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0369a1'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0284c7'}
                    >
                        + Create Issue
                    </button>
                </div>
            </div>

            {/* Active Sprint Banner */}
            {activeSprint && (selectedSprint === 'active' || selectedSprint === String(activeSprint.id) || selectedSprint === 'all') && (
                <div style={{
                    padding: '10px 24px',
                    backgroundColor: '#eaf2fe',
                    borderBottom: '1px solid #bfdbfe',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    color: '#1e3a8a'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{
                            backgroundColor: '#1d4ed8',
                            color: '#ffffff',
                            padding: '3px 10px',
                            borderRadius: '12px',
                            fontWeight: '700',
                            fontSize: '11px',
                            letterSpacing: '0.4px',
                            textTransform: 'uppercase'
                        }}>
                            ⚡ Active Sprint
                        </span>
                        <strong style={{ fontSize: '14px', color: '#1e3a8a', fontWeight: '800' }}>{activeSprint.name}</strong>
                        {activeSprint.goal && (
                            <span style={{ color: '#2563eb', fontStyle: 'italic', fontSize: '13px', fontWeight: '500' }}>
                                &ldquo;{activeSprint.goal}&rdquo;
                            </span>
                        )}
                        {activeSprint.endDate && (
                            <span style={{ color: '#475569', fontSize: '12px', fontWeight: '500' }}>
                                (Ends {new Date(activeSprint.endDate).toLocaleDateString()})
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                backgroundColor: '#1d4ed8',
                                color: '#ffffff',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: '700'
                            }}>
                                {activeSprint.issues?.reduce((acc, i) => acc + (i.storyPoints || 0), 0) || 0}
                            </span>
                            <span style={{ fontSize: '12px', color: '#1e3a8a', fontWeight: '700' }}>Story Points</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div style={{
                    padding: '10px 24px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderBottom: '1px solid rgba(239, 68, 68, 0.25)',
                    color: '#dc2626',
                    fontSize: '13px',
                    fontWeight: '600'
                }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Kanban Columns Grid */}
            <div style={{
                flex: 1,
                padding: '20px 24px',
                display: 'flex',
                gap: '16px',
                overflowX: 'auto',
                overflowY: 'hidden',
                backgroundColor: '#f8fafd'
            }}>
                {loading ? (
                    <div style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748b',
                        fontSize: '16px'
                    }}>
                        Loading board columns & issues...
                    </div>
                ) : (
                    boardData.columns.map(column => (
                        <KanbanColumn
                            key={column.id}
                            column={column}
                            onCardClick={(id) => setSelectedTaskId(id)}
                            onCardMove={handleCardMove}
                            onQuickCreate={handleQuickCreate}
                            onPermissionDenied={handlePermissionDenied}
                        />
                    ))
                )}
            </div>

            {/* Task Detail Modal */}
            {selectedTaskId && (
                <TaskDetailModal
                    taskId={selectedTaskId}
                    onClose={() => setSelectedTaskId(null)}
                    onTaskUpdated={fetchBoard}
                    statuses={boardData.columns}
                    members={boardData.members}
                    components={componentsList}
                    allLabels={boardData.labels}
                />
            )}

            {/* Create Issue Modal */}
            {createModalOpen && (
                <CreateIssueModal
                    initialStatusId={createModalStatusId}
                    statuses={boardData.columns}
                    members={boardData.members}
                    components={componentsList}
                    onClose={() => {
                        setCreateModalOpen(false);
                        setCreateModalStatusId(null);
                    }}
                    onIssueCreated={fetchBoard}
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

export default KanbanBoard;

