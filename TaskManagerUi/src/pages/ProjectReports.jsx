import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../Api/Axios';
import MetricCard from '../components/charts/MetricCard';
import BurndownChart from '../components/charts/BurndownChart';
import VelocityBarChart from '../components/charts/VelocityBarChart';
import BreakdownBarChart from '../components/charts/BreakdownBarChart';
import DonutChart from '../components/charts/DonutChart';

const ISSUE_TYPE_ICONS = {
    Bug: '🐞',
    Story: '📖',
    Epic: '⚡',
    Subtask: '↳',
    Task: '✅'
};

const ProjectReports = () => {
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

    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'burndown', 'velocity', 'sprint-report'
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Data states
    const [summary, setSummary] = useState(null);
    const [breakdowns, setBreakdowns] = useState(null);
    const [sprintsList, setSprintsList] = useState([]);

    // Burndown state
    const [selectedBurndownSprintId, setSelectedBurndownSprintId] = useState('');
    const [burndownData, setBurndownData] = useState(null);
    const [loadingBurndown, setLoadingBurndown] = useState(false);

    // Velocity state
    const [velocityData, setVelocityData] = useState(null);
    const [loadingVelocity, setLoadingVelocity] = useState(false);

    // Sprint Report state
    const [selectedReportSprintId, setSelectedReportSprintId] = useState('');
    const [detailedSprintReport, setDetailedSprintReport] = useState(null);
    const [loadingDetailedReport, setLoadingDetailedReport] = useState(false);

    // Initial load: summary, breakdowns, sprints list
    const fetchCoreReports = useCallback(async () => {
        try {
            if (!token) {
                navigate('/login');
                return;
            }
            setLoading(true);
            setError(null);

            const [summaryRes, breakdownsRes, sprintsRes] = await Promise.all([
                api.get('/reports/summary'),
                api.get('/reports/breakdowns'),
                api.get('/reports/sprints-list')
            ]);

            setSummary(summaryRes.data);
            setBreakdowns(breakdownsRes.data);
            setSprintsList(sprintsRes.data || []);

            // Set initial selected sprints
            if (sprintsRes.data && sprintsRes.data.length > 0) {
                const active = sprintsRes.data.find(s => s.status === 'Active') || sprintsRes.data[0];
                setSelectedBurndownSprintId(String(active.id));
                setSelectedReportSprintId(String(active.id));
            }
        } catch (err) {
            console.error('Failed to load reports', err);
            setError(err.response?.data?.message || 'Failed to load report data.');
        } finally {
            setLoading(false);
        }
    }, [token, navigate]);

    useEffect(() => {
        fetchCoreReports();
    }, [fetchCoreReports]);

    // Fetch Burndown data
    const fetchBurndown = useCallback(async (sprintId) => {
        try {
            setLoadingBurndown(true);
            const params = sprintId ? { sprintId } : {};
            const res = await api.get('/reports/sprint-burndown', { params });
            setBurndownData(res.data);
        } catch (err) {
            console.error('Failed to load burndown', err);
        } finally {
            setLoadingBurndown(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'burndown' || activeTab === 'overview') {
            fetchBurndown(selectedBurndownSprintId);
        }
    }, [activeTab, selectedBurndownSprintId, fetchBurndown]);

    // Fetch Velocity data
    const fetchVelocity = useCallback(async () => {
        try {
            setLoadingVelocity(true);
            const res = await api.get('/reports/sprint-velocity');
            setVelocityData(res.data);
        } catch (err) {
            console.error('Failed to load velocity', err);
        } finally {
            setLoadingVelocity(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'velocity') {
            fetchVelocity();
        }
    }, [activeTab, fetchVelocity]);

    // Fetch Detailed Sprint Report
    const fetchDetailedSprintReport = useCallback(async (sprintId) => {
        if (!sprintId) return;
        try {
            setLoadingDetailedReport(true);
            const res = await api.get(`/reports/sprint-report/${sprintId}`);
            setDetailedSprintReport(res.data);
        } catch (err) {
            console.error('Failed to load detailed sprint report', err);
        } finally {
            setLoadingDetailedReport(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'sprint-report' && selectedReportSprintId) {
            fetchDetailedSprintReport(selectedReportSprintId);
        }
    }, [activeTab, selectedReportSprintId, fetchDetailedSprintReport]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
                                    overflow: 'hidden',
            fontFamily: 'var(--font-sans)',
            backgroundColor: 'var(--bg-base)'
        }}>
            {/* Top Navigation Header */}
            <header style={{
                height: '56px',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
                borderBottom: '1px solid var(--bg-border)',
                boxShadow: 'var(--shadow-sm)',
                zIndex: 10,
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '18px', letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>
                        <span style={{ fontSize: '20px' }}>📊</span> Project Reports & Analytics
                    </div>
                    <span style={{ color: 'var(--bg-border)', fontSize: '16px' }}>|</span>
                    <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-tertiary)' }}>Task Management System</span>
                </div>
            </header>

            {/* Subheader & Tab Controls */}
            <div style={{
                backgroundColor: '#ffffff',
                borderBottom: '1px solid #ebecf0',
                padding: '0 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0
            }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                        { id: 'overview', label: '📊 Dashboard Overview' },
                        { id: 'burndown', label: '📉 Sprint Burndown' },
                        { id: 'velocity', label: '📈 Sprint Velocity' },
                        { id: 'sprint-report', label: '📋 Sprint Reports' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '14px 16px',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: activeTab === tab.id ? '3px solid #0052cc' : '3px solid transparent',
                                color: activeTab === tab.id ? '#0052cc' : '#42526e',
                                fontWeight: activeTab === tab.id ? '700' : '500',
                                fontSize: '14px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                        onClick={fetchCoreReports}
                        style={{
                            backgroundColor: '#f4f5f7',
                            border: '1px solid #dfe1e6',
                            borderRadius: '4px',
                            padding: '6px 12px',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#42526e',
                            cursor: 'pointer'
                        }}
                    >
                        🔄 Refresh Data
                    </button>
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div style={{
                    padding: '12px 24px',
                    backgroundColor: '#ffebe6',
                    color: '#de350b',
                    fontSize: '13px',
                    fontWeight: '600'
                }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Scrollable Content Container */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
            }}>
                {loading ? (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '300px',
                        color: '#6b778c',
                        fontSize: '15px'
                    }}>
                        Loading real-time project statistics & reports...
                    </div>
                ) : (
                    <>
                        {/* TAB 1: OVERVIEW */}
                        {activeTab === 'overview' && summary && breakdowns && (
                            <>
                                {/* Top Metric Cards */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                    gap: '16px'
                                }}>
                                    <MetricCard
                                        title="Total Issues"
                                        value={summary.totalIssues}
                                        subtitle="Active in project"
                                        icon="📁"
                                        color="#0052cc"
                                        bgColor="#deebff"
                                    />
                                    <MetricCard
                                        title="Completed"
                                        value={summary.completedIssues}
                                        subtitle={`${summary.completionPercentage}% of work done`}
                                        icon="✅"
                                        color="#36b37e"
                                        bgColor="#e3fcef"
                                        progress={summary.completionPercentage}
                                    />
                                    <MetricCard
                                        title="In Progress"
                                        value={summary.inProgressIssues}
                                        subtitle="Being worked on"
                                        icon="⚡"
                                        color="#ffab00"
                                        bgColor="#fffae6"
                                    />
                                    <MetricCard
                                        title="Backlog"
                                        value={summary.backlogIssues}
                                        subtitle="Unscheduled issues"
                                        icon="📦"
                                        color="#6554c0"
                                        bgColor="#eae6ff"
                                    />
                                    <MetricCard
                                        title="Overdue"
                                        value={summary.overdueIssues}
                                        subtitle={summary.overdueIssues > 0 ? "Requires attention" : "All on schedule"}
                                        icon="⚠️"
                                        color={summary.overdueIssues > 0 ? "#de350b" : "#36b37e"}
                                        bgColor={summary.overdueIssues > 0 ? "#ffebe6" : "#e3fcef"}
                                    />
                                </div>

                                {/* Active Sprint Spotlight & Story Points Row */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                                    gap: '20px'
                                }}>
                                    {/* Active Sprint Widget */}
                                    <div style={{
                                        backgroundColor: '#ffffff',
                                        borderRadius: '8px',
                                        border: '1px solid #ebecf0',
                                        padding: '20px',
                                        boxShadow: '0 1px 3px rgba(9, 30, 66, 0.08)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{
                                                    backgroundColor: '#0052cc',
                                                    color: '#ffffff',
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    fontWeight: '700',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    ⚡ Active Sprint
                                                </span>
                                                <strong style={{ fontSize: '16px', color: '#172b4d' }}>
                                                    {summary.activeSprint ? summary.activeSprint.name : 'No Active Sprint'}
                                                </strong>
                                            </div>

                                            {summary.activeSprint && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedBurndownSprintId(String(summary.activeSprint.sprintId));
                                                        setActiveTab('burndown');
                                                    }}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: '#0052cc',
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    View Burndown &rarr;
                                                </button>
                                            )}
                                        </div>

                                        {summary.activeSprint ? (
                                            <div>
                                                {summary.activeSprint.goal && (
                                                    <div style={{ color: '#5e6c84', fontStyle: 'italic', fontSize: '13px', marginBottom: '14px' }}>
                                                        &ldquo;{summary.activeSprint.goal}&rdquo;
                                                    </div>
                                                )}

                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                                                    <span style={{ color: '#6b778c' }}>Sprint Progress</span>
                                                    <span style={{ fontWeight: '700', color: '#172b4d' }}>
                                                        {summary.activeSprint.completedStoryPoints} / {summary.activeSprint.totalStoryPoints} pts ({summary.activeSprint.completionPercentage}%)
                                                    </span>
                                                </div>

                                                <div style={{
                                                    height: '8px',
                                                    backgroundColor: '#ebecf0',
                                                    borderRadius: '4px',
                                                    overflow: 'hidden',
                                                    marginBottom: '16px'
                                                }}>
                                                    <div style={{
                                                        width: `${summary.activeSprint.completionPercentage}%`,
                                                        height: '100%',
                                                        backgroundColor: '#36b37e',
                                                        borderRadius: '4px',
                                                        transition: 'width 0.4s ease'
                                                    }} />
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
                                                    <div style={{ padding: '8px', backgroundColor: '#f4f5f7', borderRadius: '4px' }}>
                                                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#172b4d' }}>{summary.activeSprint.totalIssues}</div>
                                                        <div style={{ fontSize: '11px', color: '#5e6c84' }}>Total Issues</div>
                                                    </div>
                                                    <div style={{ padding: '8px', backgroundColor: '#e3fcef', borderRadius: '4px' }}>
                                                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#006644' }}>{summary.activeSprint.completedIssues}</div>
                                                        <div style={{ fontSize: '11px', color: '#006644' }}>Completed</div>
                                                    </div>
                                                    <div style={{ padding: '8px', backgroundColor: '#fffae6', borderRadius: '4px' }}>
                                                        <div style={{ fontSize: '18px', fontWeight: '800', color: '#974f00' }}>{summary.activeSprint.daysRemaining}d</div>
                                                        <div style={{ fontSize: '11px', color: '#974f00' }}>Remaining</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ padding: '20px 0', textAlign: 'center', color: '#6b778c', fontSize: '13px' }}>
                                                There is no sprint currently active. Start a sprint from the <Link to="/backlog" style={{ color: '#0052cc', fontWeight: '600' }}>Backlog</Link> to view live tracking.
                                            </div>
                                        )}
                                    </div>

                                    {/* Story Points Completed vs Remaining Donut */}
                                    <div style={{
                                        backgroundColor: '#ffffff',
                                        borderRadius: '8px',
                                        border: '1px solid #ebecf0',
                                        padding: '20px',
                                        boxShadow: '0 1px 3px rgba(9, 30, 66, 0.08)'
                                    }}>
                                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#172b4d', marginBottom: '14px' }}>
                                            Story Points Overview
                                        </div>

                                        <DonutChart
                                            items={[
                                                { label: 'Completed Points', value: summary.completedStoryPoints, color: '#36b37e' },
                                                { label: 'Remaining Points', value: summary.remainingStoryPoints, color: '#4c9aff' }
                                            ]}
                                            centerValue={`${summary.completionPercentage}%`}
                                            centerLabel="Done"
                                            size={160}
                                        />
                                    </div>
                                </div>

                                {/* Status & Priority Breakdowns Row */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                                    gap: '20px'
                                }}>
                                    <div style={{
                                        backgroundColor: '#ffffff',
                                        borderRadius: '8px',
                                        border: '1px solid #ebecf0',
                                        padding: '20px',
                                        boxShadow: '0 1px 3px rgba(9, 30, 66, 0.08)'
                                    }}>
                                        <BreakdownBarChart
                                            title="Issues by Status"
                                            items={breakdowns.byStatus}
                                        />
                                    </div>

                                    <div style={{
                                        backgroundColor: '#ffffff',
                                        borderRadius: '8px',
                                        border: '1px solid #ebecf0',
                                        padding: '20px',
                                        boxShadow: '0 1px 3px rgba(9, 30, 66, 0.08)'
                                    }}>
                                        <BreakdownBarChart
                                            title="Issues by Priority"
                                            items={breakdowns.byPriority}
                                        />
                                    </div>
                                </div>

                                {/* Assignee & Issue Type Breakdowns Row */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                                    gap: '20px'
                                }}>
                                    {/* Assignee Workload */}
                                    <div style={{
                                        backgroundColor: '#ffffff',
                                        borderRadius: '8px',
                                        border: '1px solid #ebecf0',
                                        padding: '20px',
                                        boxShadow: '0 1px 3px rgba(9, 30, 66, 0.08)'
                                    }}>
                                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#172b4d', marginBottom: '14px' }}>
                                            Issues & Story Points by Assignee
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {breakdowns.byAssignee.map((a, idx) => (
                                                <div key={idx} style={{
                                                    padding: '10px',
                                                    backgroundColor: '#fafbfc',
                                                    borderRadius: '6px',
                                                    border: '1px solid #ebecf0',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between'
                                                }}>
                                                    <div>
                                                        <div style={{ fontWeight: '600', fontSize: '13px', color: '#172b4d' }}>
                                                            👤 {a.userName}
                                                        </div>
                                                        <div style={{ fontSize: '11px', color: '#6b778c' }}>
                                                            {a.completedIssues} of {a.totalIssues} issues completed ({a.completionPercentage}%)
                                                        </div>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <span style={{
                                                            backgroundColor: '#deebff',
                                                            color: '#0747a6',
                                                            fontWeight: '700',
                                                            fontSize: '12px',
                                                            padding: '2px 8px',
                                                            borderRadius: '10px'
                                                        }}>
                                                            {a.totalStoryPoints} pts
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Issue Types */}
                                    <div style={{
                                        backgroundColor: '#ffffff',
                                        borderRadius: '8px',
                                        border: '1px solid #ebecf0',
                                        padding: '20px',
                                        boxShadow: '0 1px 3px rgba(9, 30, 66, 0.08)'
                                    }}>
                                        <div style={{ fontSize: '15px', fontWeight: '700', color: '#172b4d', marginBottom: '14px' }}>
                                            Issues by Issue Type
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {breakdowns.byIssueType.map((it, idx) => (
                                                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px' }}>
                                                        <span style={{ fontWeight: '600', color: '#172b4d' }}>
                                                            {ISSUE_TYPE_ICONS[it.name] || '✅'} {it.name}
                                                        </span>
                                                        <span style={{ color: '#5e6c84', fontWeight: '600' }}>
                                                            {it.count} ({it.percentage}%)
                                                        </span>
                                                    </div>
                                                    <div style={{
                                                        height: '6px',
                                                        backgroundColor: '#ebecf0',
                                                        borderRadius: '3px',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <div style={{
                                                            width: `${it.percentage}%`,
                                                            height: '100%',
                                                            backgroundColor: it.colorHex || '#4a90e2',
                                                            borderRadius: '3px'
                                                        }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Epic Progress Section */}
                                <div style={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: '8px',
                                    border: '1px solid #ebecf0',
                                    padding: '20px',
                                    boxShadow: '0 1px 3px rgba(9, 30, 66, 0.08)'
                                }}>
                                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#172b4d', marginBottom: '16px' }}>
                                        ⚡ Epic Progress Tracker
                                    </div>

                                    {summary.epicProgress && summary.epicProgress.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                            {summary.epicProgress.map(epic => (
                                                <div key={epic.epicId} style={{
                                                    padding: '12px 16px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #ebecf0',
                                                    backgroundColor: '#fafbfc'
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                            <span style={{
                                                                backgroundColor: epic.colorHex ? `${epic.colorHex}22` : '#eae6ff',
                                                                color: epic.colorHex || '#403294',
                                                                border: `1px solid ${epic.colorHex || '#403294'}55`,
                                                                borderRadius: '4px',
                                                                padding: '2px 8px',
                                                                fontSize: '11px',
                                                                fontWeight: '800'
                                                            }}>
                                                                {epic.key}
                                                            </span>
                                                            <span style={{ fontWeight: '700', color: '#172b4d', fontSize: '14px' }}>
                                                                {epic.name}
                                                            </span>
                                                            {epic.summary && (
                                                                <span style={{ color: '#6b778c', fontSize: '12px' }}>
                                                                    &mdash; {epic.summary}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
                                                            <span style={{ color: '#5e6c84' }}>
                                                                {epic.completedIssues}/{epic.totalIssues} issues
                                                            </span>
                                                            <span style={{ fontWeight: '700', color: '#172b4d' }}>
                                                                {epic.completedStoryPoints}/{epic.totalStoryPoints} pts ({epic.completionPercentage}%)
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div style={{
                                                        height: '7px',
                                                        backgroundColor: '#ebecf0',
                                                        borderRadius: '4px',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <div style={{
                                                            width: `${epic.completionPercentage}%`,
                                                            height: '100%',
                                                            backgroundColor: epic.colorHex || '#403294',
                                                            borderRadius: '4px',
                                                            transition: 'width 0.4s ease'
                                                        }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ color: '#6b778c', fontSize: '13px' }}>
                                            No Epics defined yet. Create epics from the <Link to="/backlog" style={{ color: '#0052cc', fontWeight: '600' }}>Backlog</Link>.
                                        </div>
                                    )}
                                </div>

                                {/* Overdue Issues Alert Table */}
                                {breakdowns.overdueIssues && breakdowns.overdueIssues.length > 0 && (
                                    <div style={{
                                        backgroundColor: '#ffffff',
                                        borderRadius: '8px',
                                        border: '1px solid #ffbdad',
                                        padding: '20px',
                                        boxShadow: '0 1px 3px rgba(222, 53, 11, 0.1)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: '700', color: '#de350b', marginBottom: '14px' }}>
                                            <span>⚠️</span> Overdue Issues ({breakdowns.overdueIssues.length})
                                        </div>

                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: '#ffebe6', color: '#bf2600', textAlign: 'left' }}>
                                                        <th style={{ padding: '8px 12px' }}>Key</th>
                                                        <th style={{ padding: '8px 12px' }}>Title</th>
                                                        <th style={{ padding: '8px 12px' }}>Assignee</th>
                                                        <th style={{ padding: '8px 12px' }}>Priority</th>
                                                        <th style={{ padding: '8px 12px' }}>Due Date</th>
                                                        <th style={{ padding: '8px 12px' }}>Days Overdue</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {breakdowns.overdueIssues.map(issue => (
                                                        <tr key={issue.taskId} style={{ borderBottom: '1px solid #ebecf0' }}>
                                                            <td style={{ padding: '8px 12px', fontWeight: '700', color: '#0052cc' }}>{issue.issueKey}</td>
                                                            <td style={{ padding: '8px 12px', fontWeight: '500', color: '#172b4d' }}>{issue.title}</td>
                                                            <td style={{ padding: '8px 12px', color: '#42526e' }}>{issue.assigneeName}</td>
                                                            <td style={{ padding: '8px 12px' }}>
                                                                <span style={{
                                                                    backgroundColor: `${issue.priorityColor}22`,
                                                                    color: issue.priorityColor,
                                                                    padding: '2px 6px',
                                                                    borderRadius: '3px',
                                                                    fontSize: '11px',
                                                                    fontWeight: '700'
                                                                }}>
                                                                    {issue.priorityName}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '8px 12px', color: '#de350b', fontWeight: '600' }}>
                                                                {new Date(issue.dueDate).toLocaleDateString()}
                                                            </td>
                                                            <td style={{ padding: '8px 12px' }}>
                                                                <span style={{
                                                                    backgroundColor: '#ffebe6',
                                                                    color: '#de350b',
                                                                    padding: '2px 8px',
                                                                    borderRadius: '10px',
                                                                    fontWeight: '700',
                                                                    fontSize: '11px'
                                                                }}>
                                                                    {issue.daysOverdue} days
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* TAB 2: SPRINT BURNDOWN */}
                        {activeTab === 'burndown' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* Sprint Selector Toolbar */}
                                <div style={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: '8px',
                                    border: '1px solid #ebecf0',
                                    padding: '16px 20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: '12px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <label style={{ fontSize: '13px', fontWeight: '700', color: '#172b4d' }}>
                                            Select Sprint:
                                        </label>
                                        <select
                                            value={selectedBurndownSprintId}
                                            onChange={(e) => setSelectedBurndownSprintId(e.target.value)}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '4px',
                                                border: '1px solid #dfe1e6',
                                                fontSize: '13px',
                                                color: '#172b4d',
                                                backgroundColor: '#ffffff',
                                                minWidth: '220px'
                                            }}
                                        >
                                            {sprintsList.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name} ({s.status})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {burndownData && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px' }}>
                                            <span>Planned: <strong>{burndownData.totalStoryPoints} pts</strong></span>
                                            <span>Completed: <strong style={{ color: '#36b37e' }}>{burndownData.completedStoryPoints} pts</strong></span>
                                            <span>Remaining: <strong style={{ color: '#0052cc' }}>{burndownData.remainingStoryPoints} pts</strong></span>
                                        </div>
                                    )}
                                </div>

                                {/* Burndown Chart Card */}
                                <div style={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: '8px',
                                    border: '1px solid #ebecf0',
                                    padding: '24px',
                                    boxShadow: '0 1px 3px rgba(9, 30, 66, 0.08)'
                                }}>
                                    <div style={{ marginBottom: '16px' }}>
                                        <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#172b4d' }}>
                                            {burndownData ? burndownData.sprintName : 'Sprint Burndown'}
                                        </h3>
                                        {burndownData && burndownData.sprintGoal && (
                                            <p style={{ margin: 0, color: '#5e6c84', fontStyle: 'italic', fontSize: '13px' }}>
                                                Goal: &ldquo;{burndownData.sprintGoal}&rdquo;
                                            </p>
                                        )}
                                        {burndownData && (
                                            <div style={{ color: '#8993a4', fontSize: '12px', marginTop: '4px' }}>
                                                Duration: {new Date(burndownData.startDate).toLocaleDateString()} &mdash; {new Date(burndownData.endDate).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>

                                    {loadingBurndown ? (
                                        <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b778c' }}>
                                            Calculating sprint burn progression...
                                        </div>
                                    ) : (
                                        <BurndownChart
                                            dataPoints={burndownData?.dataPoints || []}
                                            totalStoryPoints={burndownData?.totalStoryPoints || 0}
                                        />
                                    )}
                                </div>

                                {/* Daily Audit Table */}
                                {burndownData && burndownData.dataPoints && burndownData.dataPoints.length > 0 && (
                                    <div style={{
                                        backgroundColor: '#ffffff',
                                        borderRadius: '8px',
                                        border: '1px solid #ebecf0',
                                        padding: '20px',
                                        boxShadow: '0 1px 3px rgba(9, 30, 66, 0.08)'
                                    }}>
                                        <h4 style={{ margin: '0 0 14px 0', fontSize: '15px', color: '#172b4d' }}>
                                            Daily Burndown Breakdown
                                        </h4>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: '#f4f5f7', color: '#5e6c84', textAlign: 'left' }}>
                                                        <th style={{ padding: '8px 12px' }}>Day</th>
                                                        <th style={{ padding: '8px 12px' }}>Date</th>
                                                        <th style={{ padding: '8px 12px' }}>Ideal Remaining</th>
                                                        <th style={{ padding: '8px 12px' }}>Actual Remaining</th>
                                                        <th style={{ padding: '8px 12px' }}>Completed on Day</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {burndownData.dataPoints.map((pt, idx) => (
                                                        <tr key={idx} style={{ borderBottom: '1px solid #ebecf0' }}>
                                                            <td style={{ padding: '8px 12px', fontWeight: '600', color: '#172b4d' }}>{pt.displayLabel}</td>
                                                            <td style={{ padding: '8px 12px', color: '#5e6c84' }}>{pt.date}</td>
                                                            <td style={{ padding: '8px 12px', color: '#8993a4' }}>{pt.idealRemaining} pts</td>
                                                            <td style={{ padding: '8px 12px', fontWeight: '700', color: '#0052cc' }}>{pt.actualRemaining} pts</td>
                                                            <td style={{ padding: '8px 12px', color: pt.completedOnThisDay > 0 ? '#006644' : '#8993a4', fontWeight: pt.completedOnThisDay > 0 ? '700' : 'normal' }}>
                                                                {pt.completedOnThisDay > 0 ? `-${pt.completedOnThisDay} pts` : '—'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 3: SPRINT VELOCITY */}
                        {activeTab === 'velocity' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: '8px',
                                    border: '1px solid #ebecf0',
                                    padding: '24px',
                                    boxShadow: '0 1px 3px rgba(9, 30, 66, 0.08)'
                                }}>
                                    <div style={{ marginBottom: '16px' }}>
                                        <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', color: '#172b4d' }}>
                                            Sprint Velocity Report
                                        </h3>
                                        <p style={{ margin: 0, color: '#5e6c84', fontSize: '13px' }}>
                                            Compares committed vs completed story points across past and active sprints.
                                        </p>
                                    </div>

                                    {loadingVelocity ? (
                                        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b778c' }}>
                                            Calculating velocity across sprints...
                                        </div>
                                    ) : (
                                        <VelocityBarChart
                                            sprints={velocityData?.sprints || []}
                                            averageVelocity={velocityData?.averageVelocity || 0}
                                        />
                                    )}
                                </div>

                                {/* Velocity History Table */}
                                {velocityData && velocityData.sprints && velocityData.sprints.length > 0 && (
                                    <div style={{
                                        backgroundColor: '#ffffff',
                                        borderRadius: '8px',
                                        border: '1px solid #ebecf0',
                                        padding: '20px',
                                        boxShadow: '0 1px 3px rgba(9, 30, 66, 0.08)'
                                    }}>
                                        <h4 style={{ margin: '0 0 14px 0', fontSize: '15px', color: '#172b4d' }}>
                                            Velocity History Breakdown
                                        </h4>
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: '#f4f5f7', color: '#5e6c84', textAlign: 'left' }}>
                                                        <th style={{ padding: '8px 12px' }}>Sprint</th>
                                                        <th style={{ padding: '8px 12px' }}>Status</th>
                                                        <th style={{ padding: '8px 12px' }}>Committed Points</th>
                                                        <th style={{ padding: '8px 12px' }}>Completed Points</th>
                                                        <th style={{ padding: '8px 12px' }}>Completion %</th>
                                                        <th style={{ padding: '8px 12px' }}>Issues Done</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {velocityData.sprints.map(s => (
                                                        <tr key={s.sprintId} style={{ borderBottom: '1px solid #ebecf0' }}>
                                                            <td style={{ padding: '8px 12px', fontWeight: '700', color: '#172b4d' }}>{s.sprintName}</td>
                                                            <td style={{ padding: '8px 12px' }}>
                                                                <span style={{
                                                                    backgroundColor: s.status === 'Completed' ? '#e3fcef' : '#deebff',
                                                                    color: s.status === 'Completed' ? '#006644' : '#0747a6',
                                                                    padding: '2px 8px',
                                                                    borderRadius: '10px',
                                                                    fontSize: '11px',
                                                                    fontWeight: '700'
                                                                }}>
                                                                    {s.status}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '8px 12px', color: '#4c9aff', fontWeight: '700' }}>{s.committedStoryPoints} pts</td>
                                                            <td style={{ padding: '8px 12px', color: '#36b37e', fontWeight: '700' }}>{s.completedStoryPoints} pts</td>
                                                            <td style={{ padding: '8px 12px', fontWeight: '600' }}>{s.completionPercentage}%</td>
                                                            <td style={{ padding: '8px 12px', color: '#5e6c84' }}>{s.completedIssues} / {s.totalIssues}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 4: SPRINT REPORTS */}
                        {activeTab === 'sprint-report' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* Selector Toolbar */}
                                <div style={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: '8px',
                                    border: '1px solid #ebecf0',
                                    padding: '16px 20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: '12px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <label style={{ fontSize: '13px', fontWeight: '700', color: '#172b4d' }}>
                                            Select Sprint Report:
                                        </label>
                                        <select
                                            value={selectedReportSprintId}
                                            onChange={(e) => setSelectedReportSprintId(e.target.value)}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '4px',
                                                border: '1px solid #dfe1e6',
                                                fontSize: '13px',
                                                color: '#172b4d',
                                                backgroundColor: '#ffffff',
                                                minWidth: '220px'
                                            }}
                                        >
                                            {sprintsList.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.name} ({s.status})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {loadingDetailedReport ? (
                                    <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b778c' }}>
                                        Loading detailed sprint report...
                                    </div>
                                ) : detailedSprintReport ? (
                                    <>
                                        {/* Sprint Scorecard */}
                                        <div style={{
                                            backgroundColor: '#ffffff',
                                            borderRadius: '8px',
                                            border: '1px solid #ebecf0',
                                            padding: '24px',
                                            boxShadow: '0 1px 3px rgba(9, 30, 66, 0.08)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                                                <div>
                                                    <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#172b4d' }}>
                                                        {detailedSprintReport.name}
                                                    </h3>
                                                    {detailedSprintReport.goal && (
                                                        <div style={{ color: '#5e6c84', fontStyle: 'italic', fontSize: '13px' }}>
                                                            Goal: &ldquo;{detailedSprintReport.goal}&rdquo;
                                                        </div>
                                                    )}
                                                </div>

                                                <span style={{
                                                    backgroundColor: detailedSprintReport.status === 'Completed' ? '#e3fcef' : '#deebff',
                                                    color: detailedSprintReport.status === 'Completed' ? '#006644' : '#0747a6',
                                                    padding: '4px 12px',
                                                    borderRadius: '12px',
                                                    fontWeight: '700',
                                                    fontSize: '12px'
                                                }}>
                                                    {detailedSprintReport.status}
                                                </span>
                                            </div>

                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                                                gap: '12px',
                                                marginBottom: '16px'
                                            }}>
                                                <div style={{ padding: '12px', backgroundColor: '#fafbfc', borderRadius: '6px', border: '1px solid #ebecf0' }}>
                                                    <div style={{ fontSize: '12px', color: '#6b778c' }}>Planned Story Points</div>
                                                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#172b4d' }}>{detailedSprintReport.totalStoryPoints} pts</div>
                                                </div>
                                                <div style={{ padding: '12px', backgroundColor: '#e3fcef', borderRadius: '6px' }}>
                                                    <div style={{ fontSize: '12px', color: '#006644' }}>Completed Story Points</div>
                                                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#006644' }}>{detailedSprintReport.completedStoryPoints} pts</div>
                                                </div>
                                                <div style={{ padding: '12px', backgroundColor: '#fffae6', borderRadius: '6px' }}>
                                                    <div style={{ fontSize: '12px', color: '#974f00' }}>Remaining Points</div>
                                                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#974f00' }}>{detailedSprintReport.remainingStoryPoints} pts</div>
                                                </div>
                                                <div style={{ padding: '12px', backgroundColor: '#deebff', borderRadius: '6px' }}>
                                                    <div style={{ fontSize: '12px', color: '#0747a6' }}>Completion Rate</div>
                                                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#0747a6' }}>{detailedSprintReport.completionPercentage}%</div>
                                                </div>
                                            </div>

                                            <div style={{
                                                height: '8px',
                                                backgroundColor: '#ebecf0',
                                                borderRadius: '4px',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    width: `${detailedSprintReport.completionPercentage}%`,
                                                    height: '100%',
                                                    backgroundColor: '#36b37e',
                                                    borderRadius: '4px'
                                                }} />
                                            </div>
                                        </div>

                                        {/* Completed Issues Table */}
                                        <div style={{
                                            backgroundColor: '#ffffff',
                                            borderRadius: '8px',
                                            border: '1px solid #ebecf0',
                                            padding: '20px',
                                            boxShadow: '0 1px 3px rgba(9, 30, 66, 0.08)'
                                        }}>
                                            <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#006644' }}>
                                                ✅ Completed Issues ({detailedSprintReport.completedIssuesCount})
                                            </h4>

                                            {detailedSprintReport.completedIssues.length > 0 ? (
                                                <div style={{ overflowX: 'auto' }}>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                                        <thead>
                                                            <tr style={{ backgroundColor: '#f4f5f7', color: '#5e6c84', textAlign: 'left' }}>
                                                                <th style={{ padding: '8px 12px' }}>Key</th>
                                                                <th style={{ padding: '8px 12px' }}>Summary</th>
                                                                <th style={{ padding: '8px 12px' }}>Type</th>
                                                                <th style={{ padding: '8px 12px' }}>Priority</th>
                                                                <th style={{ padding: '8px 12px' }}>Assignee</th>
                                                                <th style={{ padding: '8px 12px' }}>Points</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {detailedSprintReport.completedIssues.map(issue => (
                                                                <tr key={issue.taskId} style={{ borderBottom: '1px solid #ebecf0' }}>
                                                                    <td style={{ padding: '8px 12px', fontWeight: '700', color: '#0052cc' }}>{issue.issueKey}</td>
                                                                    <td style={{ padding: '8px 12px', fontWeight: '500', color: '#172b4d' }}>
                                                                        {issue.title}
                                                                        {issue.epicName && (
                                                                            <span style={{
                                                                                marginLeft: '8px',
                                                                                backgroundColor: `${issue.epicColor || '#403294'}22`,
                                                                                color: issue.epicColor || '#403294',
                                                                                padding: '1px 6px',
                                                                                borderRadius: '3px',
                                                                                fontSize: '11px',
                                                                                fontWeight: '700'
                                                                            }}>
                                                                                ⚡ {issue.epicName}
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td style={{ padding: '8px 12px' }}>{issue.issueTypeName}</td>
                                                                    <td style={{ padding: '8px 12px' }}>
                                                                        <span style={{
                                                                            backgroundColor: `${issue.priorityColor}22`,
                                                                            color: issue.priorityColor,
                                                                            padding: '2px 6px',
                                                                            borderRadius: '3px',
                                                                            fontSize: '11px',
                                                                            fontWeight: '700'
                                                                        }}>
                                                                            {issue.priorityName}
                                                                        </span>
                                                                    </td>
                                                                    <td style={{ padding: '8px 12px', color: '#42526e' }}>{issue.assigneeName}</td>
                                                                    <td style={{ padding: '8px 12px', fontWeight: '700', color: '#36b37e' }}>
                                                                        {issue.storyPoints ?? 0} pts
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div style={{ color: '#6b778c', fontSize: '13px' }}>
                                                    No issues were completed in this sprint.
                                                </div>
                                            )}
                                        </div>

                                        {/* Incomplete Issues Table */}
                                        <div style={{
                                            backgroundColor: '#ffffff',
                                            borderRadius: '8px',
                                            border: '1px solid #ebecf0',
                                            padding: '20px',
                                            boxShadow: '0 1px 3px rgba(9, 30, 66, 0.08)'
                                        }}>
                                            <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#de350b' }}>
                                                ⏳ Incomplete / Unfinished Issues ({detailedSprintReport.incompleteIssuesCount})
                                            </h4>

                                            {detailedSprintReport.incompleteIssues.length > 0 ? (
                                                <div style={{ overflowX: 'auto' }}>
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                                        <thead>
                                                            <tr style={{ backgroundColor: '#f4f5f7', color: '#5e6c84', textAlign: 'left' }}>
                                                                <th style={{ padding: '8px 12px' }}>Key</th>
                                                                <th style={{ padding: '8px 12px' }}>Summary</th>
                                                                <th style={{ padding: '8px 12px' }}>Status</th>
                                                                <th style={{ padding: '8px 12px' }}>Priority</th>
                                                                <th style={{ padding: '8px 12px' }}>Assignee</th>
                                                                <th style={{ padding: '8px 12px' }}>Points</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {detailedSprintReport.incompleteIssues.map(issue => (
                                                                <tr key={issue.taskId} style={{ borderBottom: '1px solid #ebecf0' }}>
                                                                    <td style={{ padding: '8px 12px', fontWeight: '700', color: '#0052cc' }}>{issue.issueKey}</td>
                                                                    <td style={{ padding: '8px 12px', fontWeight: '500', color: '#172b4d' }}>{issue.title}</td>
                                                                    <td style={{ padding: '8px 12px' }}>
                                                                        <span style={{
                                                                            backgroundColor: '#dfe1e6',
                                                                            color: '#42526e',
                                                                            padding: '2px 8px',
                                                                            borderRadius: '10px',
                                                                            fontSize: '11px',
                                                                            fontWeight: '700'
                                                                        }}>
                                                                            {issue.statusName}
                                                                        </span>
                                                                    </td>
                                                                    <td style={{ padding: '8px 12px' }}>
                                                                        <span style={{
                                                                            backgroundColor: `${issue.priorityColor}22`,
                                                                            color: issue.priorityColor,
                                                                            padding: '2px 6px',
                                                                            borderRadius: '3px',
                                                                            fontSize: '11px',
                                                                            fontWeight: '700'
                                                                        }}>
                                                                            {issue.priorityName}
                                                                        </span>
                                                                    </td>
                                                                    <td style={{ padding: '8px 12px', color: '#42526e' }}>{issue.assigneeName}</td>
                                                                    <td style={{ padding: '8px 12px', fontWeight: '700', color: '#ffab00' }}>
                                                                        {issue.storyPoints ?? 0} pts
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div style={{ color: '#006644', fontSize: '13px', fontWeight: '600' }}>
                                                    🎉 All planned issues in this sprint were completed!
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ padding: '24px', textAlign: 'center', color: '#6b778c' }}>
                                        Select a sprint to view report details.
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ProjectReports;


