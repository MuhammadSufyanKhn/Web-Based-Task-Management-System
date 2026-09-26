import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../Api/Axios';
import KanbanColumn from '../components/KanbanColumn';
import TaskDetailModal from '../components/TaskDetailModal';
import CreateIssueModal from '../components/CreateIssueModal';

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

    // Drag-and-drop Card Move handler
    const handleCardMove = async (taskId, targetStatusId, targetPosition) => {
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
            alert(err.response?.data?.message || 'Failed to move card.');
        }
    };

    const handleQuickCreate = (statusId) => {
        setCreateModalStatusId(statusId);
        setCreateModalOpen(true);
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
            {/* Top Navigation Bar */}
            <header style={{
                height: '56px',
                backgroundColor: '#0c66e4',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '18px', letterSpacing: '0.5px' }}>
                        <span>📋</span> Project Board
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>|</span>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#e9f2ff' }}>Task Management System</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={() => {
                            setCreateModalStatusId(boardData.columns[0]?.id || null);
                            setCreateModalOpen(true);
                        }}
                        style={{
                            backgroundColor: '#ffffff',
                            color: '#0c66e4',
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

                    <Link
                        to="/backlog"
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
                        📖 Backlog & Sprints
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

                    {userRole === 'Admin' && (
                        <Link
                            to="/project-settings"
                            style={{
                                color: '#ffffff',
                                textDecoration: 'none',
                                fontSize: '13px',
                                fontWeight: '600',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                border: '1px solid rgba(255,255,255,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            ⚙️ Project Settings
                        </Link>
                    )}

                    <Link
                        to={userRole === 'Admin' ? '/Admin-dashboard' : '/dashboard'}
                        style={{
                            color: '#ffffff',
                            textDecoration: 'none',
                            fontSize: '13px',
                            fontWeight: '600',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(255,255,255,0.15)'
                        }}
                    >
                        ← Exit Board
                    </Link>
                </div>
            </header>

            {/* Filter and Control Toolbar */}
            <div style={{
                padding: '16px 24px',
                borderBottom: '1px solid #ebecf0',
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px',
                backgroundColor: '#ffffff'
            }}>
                {/* Search */}
                <div style={{ position: 'relative', width: '220px' }}>
                    <input
                        type="text"
                        placeholder="Search issues..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '7px 12px 7px 30px',
                            border: '1px solid #dfe1e6',
                            borderRadius: '4px',
                            fontSize: '13px',
                            outline: 'none',
                            boxSizing: 'border-box'
                        }}
                    />
                    <span style={{ position: 'absolute', left: '10px', top: '7px', fontSize: '13px', color: '#6b778c' }}>
                        🔍
                    </span>
                </div>

                {/* Only My Tasks toggle */}
                <button
                    onClick={() => setOnlyMyTasks(!onlyMyTasks)}
                    style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: '1px solid #dfe1e6',
                        backgroundColor: onlyMyTasks ? '#deebff' : '#f4f5f7',
                        color: onlyMyTasks ? '#0747a6' : '#42526e',
                        fontWeight: '600',
                        fontSize: '13px',
                        cursor: 'pointer'
                    }}
                >
                    👤 Only My Issues
                </button>

                {/* Assignee Filter */}
                <select
                    value={selectedAssignee}
                    onChange={(e) => setSelectedAssignee(e.target.value)}
                    style={{
                        padding: '6px 10px',
                        borderRadius: '4px',
                        border: '1px solid #dfe1e6',
                        fontSize: '13px',
                        color: '#42526e',
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
                        borderRadius: '4px',
                        border: '1px solid #dfe1e6',
                        fontSize: '13px',
                        color: '#42526e',
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
                        borderRadius: '4px',
                        border: '1px solid #dfe1e6',
                        fontSize: '13px',
                        color: '#42526e',
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
                        borderRadius: '4px',
                        border: '1px solid #dfe1e6',
                        fontSize: '13px',
                        color: '#42526e',
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
                        borderRadius: '4px',
                        border: '1px solid #dfe1e6',
                        fontSize: '13px',
                        color: '#42526e',
                        backgroundColor: selectedSprint !== 'all' ? '#e9f2ff' : '#ffffff',
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
                            color: '#0052cc',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600'
                        }}
                    >
                        Clear Filters
                    </button>
                )}

                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        onClick={fetchBoard}
                        title="Refresh board"
                        style={{
                            background: '#f4f5f7',
                            border: '1px solid #dfe1e6',
                            borderRadius: '4px',
                            padding: '6px 10px',
                            fontSize: '13px',
                            cursor: 'pointer',
                            color: '#42526e'
                        }}
                    >
                        🔄 Refresh
                    </button>
                </div>
            </div>

            {/* Active Sprint Banner */}
            {activeSprint && (selectedSprint === 'active' || selectedSprint === String(activeSprint.id) || selectedSprint === 'all') && (
                <div style={{
                    padding: '8px 24px',
                    backgroundColor: '#f0f7ff',
                    borderBottom: '1px solid #cce0ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    color: '#091e42'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{
                            backgroundColor: '#0c66e4',
                            color: '#ffffff',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontWeight: '700',
                            fontSize: '11px',
                            letterSpacing: '0.3px',
                            textTransform: 'uppercase'
                        }}>
                            ⚡ Active Sprint
                        </span>
                        <strong style={{ fontSize: '13px', color: '#091e42' }}>{activeSprint.name}</strong>
                        {activeSprint.goal && (
                            <span style={{ color: '#5e6c84', fontStyle: 'italic', fontSize: '12px' }}>
                                &ldquo;{activeSprint.goal}&rdquo;
                            </span>
                        )}
                        {activeSprint.endDate && (
                            <span style={{ color: '#6b778c', fontSize: '12px' }}>
                                (Ends {new Date(activeSprint.endDate).toLocaleDateString()})
                            </span>
                        )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                backgroundColor: '#0052cc',
                                color: '#ffffff',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: '700'
                            }}>
                                {activeSprint.issues?.reduce((acc, i) => acc + (i.storyPoints || 0), 0) || 0}
                            </span>
                            <span style={{ fontSize: '12px', color: '#6b778c' }}>Story Points</span>
                        </div>
                        <Link
                            to="/backlog"
                            style={{
                                color: '#0052cc',
                                textDecoration: 'none',
                                fontWeight: '600',
                                fontSize: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                        >
                            Open Backlog &rarr;
                        </Link>
                    </div>
                </div>
            )}

            {/* Error Message */}
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

            {/* Kanban Columns Grid */}
            <div style={{
                flex: 1,
                padding: '20px 24px',
                display: 'flex',
                gap: '16px',
                overflowX: 'auto',
                overflowY: 'hidden',
                backgroundColor: '#ffffff'
            }}>
                {loading ? (
                    <div style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#6b778c',
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
        </div>
    );
};

export default KanbanBoard;
