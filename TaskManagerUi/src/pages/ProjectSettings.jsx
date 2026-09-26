import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../Api/Axios';

const ProjectSettings = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('statuses');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [config, setConfig] = useState({
        statuses: [],
        issueTypes: [],
        priorities: [],
        labels: [],
        components: []
    });
    const [members, setMembers] = useState([]);

    // New status form
    const [newStatus, setNewStatus] = useState({ displayName: '', category: 'InProgress', colorHex: '#0052cc', orderIndex: 1 });
    // New label form
    const [newLabel, setNewLabel] = useState({ name: '', colorHex: '#6554C0' });
    // New component form
    const [newComponent, setNewComponent] = useState({ name: '', description: '', leadUserId: '' });
    // New issue type form
    const [newIssueType, setNewIssueType] = useState({ name: '', description: '', icon: 'task', colorHex: '#4a90e2', orderIndex: 1 });
    // New priority form
    const [newPriority, setNewPriority] = useState({ name: '', colorHex: '#ffab00', orderIndex: 1, isDefault: false });

    // Jira Settings state
    const [jiraConfig, setJiraConfig] = useState({
        jiraBaseUrl: '',
        userEmail: '',
        apiToken: '',
        projectKey: '',
        autoSync: false,
        isConfigured: false,
        connectionStatus: 'Disconnected',
        lastSyncedAt: null,
        lastSyncError: null,
        webhookUrl: '',
        maskedApiToken: ''
    });
    const [jiraLogs, setJiraLogs] = useState([]);
    const [jiraLoading, setJiraLoading] = useState(false);
    const [jiraMessage, setJiraMessage] = useState('');
    const [testingConnection, setTestingConnection] = useState(false);
    const [syncingNow, setSyncingNow] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [syncResult, setSyncResult] = useState(null);

    const fetchConfig = async () => {
        try {
            setLoading(true);
            setError(null);
            const [summaryRes, membersRes] = await Promise.all([
                api.get('/projectconfig/summary'),
                api.get('/projectconfig/members')
            ]);
            setConfig(summaryRes.data);
            setMembers(membersRes.data);
            setNewStatus(prev => ({ ...prev, orderIndex: (summaryRes.data.statuses.length || 0) + 1 }));
            setNewIssueType(prev => ({ ...prev, orderIndex: (summaryRes.data.issueTypes.length || 0) + 1 }));
            setNewPriority(prev => ({ ...prev, orderIndex: (summaryRes.data.priorities.length || 0) + 1 }));
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load project configuration.');
        } finally {
            setLoading(false);
        }
    };

    const fetchJiraSettings = async () => {
        try {
            setJiraLoading(true);
            const [configRes, logsRes] = await Promise.all([
                api.get('/jira/config').catch(() => ({ data: null })),
                api.get('/jira/logs').catch(() => ({ data: [] }))
            ]);
            if (configRes.data) {
                setJiraConfig({
                    jiraBaseUrl: configRes.data.jiraBaseUrl || configRes.data.jiraUrl || '',
                    userEmail: configRes.data.userEmail || configRes.data.email || '',
                    apiToken: '',
                    projectKey: configRes.data.projectKey || '',
                    autoSync: !!configRes.data.autoSync,
                    isConfigured: !!configRes.data.isConfigured || !!configRes.data.hasApiToken,
                    connectionStatus: configRes.data.connectionStatus || 'Disconnected',
                    lastSyncedAt: configRes.data.lastSyncedAt || null,
                    lastSyncError: configRes.data.lastSyncError || null,
                    webhookUrl: configRes.data.webhookUrl || '',
                    maskedApiToken: configRes.data.maskedApiToken || (configRes.data.hasApiToken ? '••••••••' : '')
                });
            }
            setJiraLogs(logsRes.data || []);
        } catch (err) {
            console.error('Failed to load Jira settings', err);
        } finally {
            setJiraLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
        fetchJiraSettings();
    }, []);

    // Create Status
    const handleAddStatus = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projectconfig/statuses', newStatus);
            setNewStatus({ displayName: '', category: 'InProgress', colorHex: '#0052cc', orderIndex: config.statuses.length + 2 });
            fetchConfig();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add status.');
        }
    };

    // Delete Status
    const handleDeleteStatus = async (id) => {
        if (!window.confirm('Are you sure you want to delete this status?')) return;
        try {
            await api.delete(`/projectconfig/statuses/${id}`);
            fetchConfig();
        } catch (err) {
            alert(err.response?.data?.message || err.response?.data || 'Failed to delete status.');
        }
    };

    // Create Issue Type
    const handleAddIssueType = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projectconfig/issuetypes', newIssueType);
            setNewIssueType({ name: '', description: '', icon: 'task', colorHex: '#4a90e2', orderIndex: config.issueTypes.length + 2 });
            fetchConfig();
        } catch (err) {
            alert(err.response?.data?.message || err.response?.data || 'Failed to add issue type.');
        }
    };

    // Delete Issue Type
    const handleDeleteIssueType = async (id) => {
        if (!window.confirm('Delete this issue type?')) return;
        try {
            await api.delete(`/projectconfig/issuetypes/${id}`);
            fetchConfig();
        } catch (err) {
            alert(err.response?.data?.message || err.response?.data || 'Failed to delete issue type.');
        }
    };

    // Create Priority
    const handleAddPriority = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projectconfig/priorities', newPriority);
            setNewPriority({ name: '', colorHex: '#ffab00', orderIndex: config.priorities.length + 2, isDefault: false });
            fetchConfig();
        } catch (err) {
            alert(err.response?.data?.message || err.response?.data || 'Failed to add priority.');
        }
    };

    // Delete Priority
    const handleDeletePriority = async (id) => {
        if (!window.confirm('Delete this priority?')) return;
        try {
            await api.delete(`/projectconfig/priorities/${id}`);
            fetchConfig();
        } catch (err) {
            alert(err.response?.data?.message || err.response?.data || 'Failed to delete priority.');
        }
    };

    // Create Label
    const handleAddLabel = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projectconfig/labels', newLabel);
            setNewLabel({ name: '', colorHex: '#6554C0' });
            fetchConfig();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to add label.');
        }
    };

    // Delete Label
    const handleDeleteLabel = async (id) => {
        if (!window.confirm('Delete this label?')) return;
        try {
            await api.delete(`/projectconfig/labels/${id}`);
            fetchConfig();
        } catch (err) {
            alert('Failed to delete label.');
        }
    };

    // Create Component
    const handleAddComponent = async (e) => {
        e.preventDefault();
        try {
            await api.post('/projectconfig/components', {
                name: newComponent.name,
                description: newComponent.description,
                leadUserId: newComponent.leadUserId ? parseInt(newComponent.leadUserId) : null
            });
            setNewComponent({ name: '', description: '', leadUserId: '' });
            fetchConfig();
        } catch (err) {
            alert('Failed to add component.');
        }
    };

    // Delete Component
    const handleDeleteComponent = async (id) => {
        if (!window.confirm('Delete this component?')) return;
        try {
            await api.delete(`/projectconfig/components/${id}`);
            fetchConfig();
        } catch (err) {
            alert('Failed to delete component.');
        }
    };

    // Update Jira Settings
    const handleSaveJira = async (e) => {
        e.preventDefault();
        try {
            setJiraLoading(true);
            setJiraMessage('');
            setTestResult(null);
            await api.post('/jira/config', {
                jiraBaseUrl: jiraConfig.jiraBaseUrl,
                userEmail: jiraConfig.userEmail,
                apiToken: jiraConfig.apiToken || null,
                projectKey: jiraConfig.projectKey,
                autoSync: jiraConfig.autoSync
            });
            setJiraMessage('Jira configuration saved successfully.');
            await fetchJiraSettings();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update Jira settings.');
        } finally {
            setJiraLoading(false);
        }
    };

    const handleTestConnection = async () => {
        try {
            setTestingConnection(true);
            setTestResult(null);
            const res = await api.post('/jira/test');
            setTestResult({ success: true, message: res.data.message || 'Connected successfully to Jira Cloud!' });
            await fetchJiraSettings();
        } catch (err) {
            setTestResult({ success: false, message: err.response?.data?.message || 'Connection test failed. Check URL, email and API token.' });
        } finally {
            setTestingConnection(false);
        }
    };

    const handleSyncNow = async () => {
        try {
            setSyncingNow(true);
            setSyncResult(null);
            const res = await api.post('/jira/sync');
            setSyncResult({
                success: true,
                message: res.data.message || 'Synchronization completed.',
                pushed: res.data.pushed,
                imported: res.data.imported
            });
            await fetchJiraSettings();
        } catch (err) {
            setSyncResult({ success: false, message: err.response?.data?.message || 'Synchronization failed.' });
        } finally {
            setSyncingNow(false);
        }
    };

    const handleDisconnectJira = async () => {
        if (!window.confirm('Are you sure you want to disconnect Jira Cloud? Stored credentials will be cleared.')) return;
        try {
            setJiraLoading(true);
            await api.post('/jira/disconnect');
            setJiraMessage('Jira integration disconnected.');
            setTestResult(null);
            setSyncResult(null);
            await fetchJiraSettings();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to disconnect Jira.');
        } finally {
            setJiraLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)' }}>
            {/* Page Header */}
            <div style={{
                padding: '20px 32px',
                backgroundColor: 'var(--bg-surface)',
                borderBottom: '1px solid var(--bg-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>⚙️</span> Project Settings & Configuration
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: '4px 0 0 0' }}>
                        Configure board columns, issue types, priorities, team access, and Jira synchronization
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="badge badge-accent" style={{ padding: '4px 10px', fontSize: '12px' }}>
                        🛡️ Administrator Settings
                    </span>
                </div>
            </div>

            {/* Content Container */}
            <div style={{
                maxWidth: '1440px',
                width: '100%',
                margin: '28px auto',
                padding: '0 24px',
                display: 'flex',
                gap: '24px',
                alignItems: 'flex-start',
                boxSizing: 'border-box'
            }}>
                {/* Left Tabs Menu */}
                <div style={{
                    width: '260px',
                    flexShrink: 0,
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: '12px',
                    border: '1px solid var(--bg-border)',
                    boxShadow: 'var(--shadow-card)',
                    padding: '16px 10px',
                    position: 'sticky',
                    top: '20px'
                }}>
                    <div style={{ padding: '4px 12px 12px 12px', fontSize: '11px', fontWeight: '700', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        Configuration
                    </div>
                    {[
                        { id: 'statuses', label: 'Columns & Statuses', icon: '📋' },
                        { id: 'issueTypes', label: 'Issue Types', icon: '🏷️' },
                        { id: 'priorities', label: 'Priorities', icon: '⚡' },
                        { id: 'labels', label: 'Labels', icon: '🔖' },
                        { id: 'components', label: 'Components', icon: '📦' },
                        { id: 'members', label: 'Members & Roles', icon: '👥' },
                        { id: 'jira', label: 'Jira Settings', icon: '🔗' }
                    ].map(tab => {
                        const isActive = activeTab === tab.id;
                        return (
                            <div
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    padding: '10px 14px',
                                    fontSize: '13.5px',
                                    fontWeight: isActive ? '700' : '500',
                                    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                                    backgroundColor: isActive ? 'var(--accent-subtle)' : 'transparent',
                                    borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    marginBottom: '3px',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                <span style={{ fontSize: '15px' }}>{tab.icon}</span>
                                <span>{tab.label}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Right Tab Content */}
                <div style={{
                    flex: 1,
                    minWidth: 0,
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: '12px',
                    border: '1px solid var(--bg-border)',
                    boxShadow: 'var(--shadow-card)',
                    padding: '32px',
                    boxSizing: 'border-box'
                }}>
                    {loading ? (
                        <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '60px 0' }}>Loading configuration...</div>
                    ) : (
                        <>
                            {/* TAB 1: STATUSES */}
                            {activeTab === 'statuses' && (
                                <div>
                                    <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Board Columns & Statuses</h2>
                                    <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: 'var(--text-tertiary)' }}>
                                        Configure the workflow stages and columns shown on your Kanban board.
                                    </p>

                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--bg-border)', backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                <th style={{ padding: '10px 14px' }}>Order</th>
                                                <th style={{ padding: '10px 14px' }}>Display Name</th>
                                                <th style={{ padding: '10px 14px' }}>System Key</th>
                                                <th style={{ padding: '10px 14px' }}>Category</th>
                                                <th style={{ padding: '10px 14px' }}>Color</th>
                                                <th style={{ padding: '10px 14px' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {config.statuses.map(s => (
                                                <tr key={s.id} style={{ borderBottom: '1px solid var(--bg-border-subtle)', fontSize: '13px' }}>
                                                    <td style={{ padding: '12px 14px', fontWeight: '700', color: 'var(--text-secondary)' }}>{s.orderIndex}</td>
                                                    <td style={{ padding: '12px 14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                                                        {s.displayName} {s.isDefault && <span style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: '700' }}>(Default)</span>}
                                                    </td>
                                                    <td style={{ padding: '12px 14px', color: 'var(--text-tertiary)' }}><code>{s.name}</code></td>
                                                    <td style={{ padding: '12px 14px' }}>
                                                        <span style={{
                                                            padding: '2px 8px',
                                                            borderRadius: '10px',
                                                            fontSize: '11px',
                                                            fontWeight: '700',
                                                            backgroundColor: s.category === 'Done' ? 'rgba(22, 163, 74, 0.12)' : 'rgba(2, 132, 199, 0.12)',
                                                            color: s.category === 'Done' ? 'var(--success-text)' : 'var(--accent)'
                                                        }}>
                                                            {s.category}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 14px' }}>
                                                        <span style={{
                                                            display: 'inline-block',
                                                            width: '18px',
                                                            height: '18px',
                                                            borderRadius: '4px',
                                                            backgroundColor: s.colorHex,
                                                            verticalAlign: 'middle',
                                                            marginRight: '8px',
                                                            boxShadow: '0 1px 3px rgba(0,0,0,0.15)'
                                                        }} />
                                                        <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{s.colorHex}</span>
                                                    </td>
                                                    <td style={{ padding: '12px 14px' }}>
                                                        <button
                                                            onClick={() => handleDeleteStatus(s.id)}
                                                            className="btn btn-danger btn-sm"
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Add Status Form */}
                                    <form onSubmit={handleAddStatus} style={{
                                        backgroundColor: 'var(--bg-subtle)',
                                        padding: '20px',
                                        borderRadius: '10px',
                                        border: '1px solid var(--bg-border)'
                                    }}>
                                        <h4 style={{ margin: '0 0 14px 0', fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>+ Add New Column / Status</h4>
                                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                            <div style={{ flex: '1 1 200px' }}>
                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                                    Display Name
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="e.g. In QA / Testing"
                                                    value={newStatus.displayName}
                                                    onChange={(e) => setNewStatus({ ...newStatus, displayName: e.target.value })}
                                                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--bg-border)', backgroundColor: '#ffffff', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                                                />
                                            </div>

                                            <div style={{ width: '150px' }}>
                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                                    Category
                                                </label>
                                                <select
                                                    value={newStatus.category}
                                                    onChange={(e) => setNewStatus({ ...newStatus, category: e.target.value })}
                                                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--bg-border)', backgroundColor: '#ffffff', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                                                >
                                                    <option value="Todo">Todo</option>
                                                    <option value="InProgress">InProgress</option>
                                                    <option value="Done">Done</option>
                                                </select>
                                            </div>

                                            <div style={{ width: '100px' }}>
                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                                    Color
                                                </label>
                                                <input
                                                    type="color"
                                                    value={newStatus.colorHex}
                                                    onChange={(e) => setNewStatus({ ...newStatus, colorHex: e.target.value })}
                                                    style={{ width: '100%', height: '36px', padding: '2px', borderRadius: '6px', border: '1px solid var(--bg-border)', cursor: 'pointer', backgroundColor: '#ffffff' }}
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                className="btn btn-primary"
                                                style={{ height: '36px' }}
                                            >
                                                Add Column
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* TAB 2: ISSUE TYPES */}
                            {activeTab === 'issueTypes' && (
                                <div>
                                    <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#172b4d' }}>Issue Types</h2>
                                    <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#6b778c' }}>
                                        Jira-standard issue types for structuring and distinguishing work items.
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
                                        {config.issueTypes.map(t => (
                                            <div key={t.id} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '14px 18px',
                                                backgroundColor: '#fafbfc',
                                                borderRadius: '8px',
                                                border: '1px solid #ebecf0'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <span style={{ fontSize: '20px' }}>
                                                        {t.name === 'Bug' ? '🐞' : t.name === 'Story' ? '📖' : t.name === 'Epic' ? '⚡' : t.name === 'Subtask' ? '↳' : '✅'}
                                                    </span>
                                                    <div>
                                                        <div style={{ fontWeight: '700', fontSize: '14px', color: '#172b4d' }}>{t.name}</div>
                                                        <div style={{ fontSize: '12px', color: '#6b778c' }}>{t.description || 'Standard work item type'}</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{ fontSize: '12px', color: '#00875a', fontWeight: '600' }}>Active</span>
                                                    {t.id > 5 && (
                                                        <span
                                                            onClick={() => handleDeleteIssueType(t.id)}
                                                            style={{ cursor: 'pointer', color: '#de350b', fontWeight: 'bold' }}
                                                            title="Delete issue type"
                                                        >
                                                            ✕
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add Issue Type Form */}
                                    <form onSubmit={handleAddIssueType} style={{
                                        backgroundColor: '#fafbfc',
                                        padding: '18px',
                                        borderRadius: '8px',
                                        border: '1px solid #ebecf0'
                                    }}>
                                        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#172b4d' }}>+ Add Custom Issue Type</h4>
                                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                            <div style={{ flex: '1 1 180px' }}>
                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b778c', marginBottom: '4px' }}>
                                                    Type Name
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="e.g. Spike or Maintenance"
                                                    value={newIssueType.name}
                                                    onChange={(e) => setNewIssueType({ ...newIssueType, name: e.target.value })}
                                                    style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #dfe1e6', boxSizing: 'border-box' }}
                                                />
                                            </div>
                                            <div style={{ flex: '1 1 200px' }}>
                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b778c', marginBottom: '4px' }}>
                                                    Description
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Brief description"
                                                    value={newIssueType.description}
                                                    onChange={(e) => setNewIssueType({ ...newIssueType, description: e.target.value })}
                                                    style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #dfe1e6', boxSizing: 'border-box' }}
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                style={{
                                                    backgroundColor: '#0052cc',
                                                    color: '#ffffff',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    padding: '9px 18px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Add Issue Type
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* TAB 3: PRIORITIES */}
                            {activeTab === 'priorities' && (
                                <div>
                                    <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#172b4d' }}>Task Priorities</h2>
                                    <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#6b778c' }}>
                                        Priorities used to prioritize tasks on the Kanban board and issue cards.
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '30px' }}>
                                        {config.priorities.map(p => (
                                            <div key={p.id} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '14px 18px',
                                                backgroundColor: '#fafbfc',
                                                borderRadius: '8px',
                                                border: '1px solid #ebecf0'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <span style={{
                                                        width: '12px',
                                                        height: '12px',
                                                        borderRadius: '50%',
                                                        backgroundColor: p.colorHex
                                                    }} />
                                                    <span style={{ fontWeight: '700', fontSize: '14px', color: '#172b4d' }}>{p.name}</span>
                                                    {p.isDefault && <span style={{ fontSize: '11px', color: '#0052cc', fontWeight: '600' }}>(Default)</span>}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <span style={{ fontSize: '12px', color: '#5e6c84', fontFamily: 'monospace' }}>{p.colorHex}</span>
                                                    {p.id > 5 && (
                                                        <span
                                                            onClick={() => handleDeletePriority(p.id)}
                                                            style={{ cursor: 'pointer', color: '#de350b', fontWeight: 'bold' }}
                                                            title="Delete priority"
                                                        >
                                                            ✕
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add Priority Form */}
                                    <form onSubmit={handleAddPriority} style={{
                                        backgroundColor: '#fafbfc',
                                        padding: '18px',
                                        borderRadius: '8px',
                                        border: '1px solid #ebecf0'
                                    }}>
                                        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#172b4d' }}>+ Add Priority</h4>
                                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                            <div style={{ flex: '1 1 180px' }}>
                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b778c', marginBottom: '4px' }}>
                                                    Priority Name
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="e.g. Critical Urgent"
                                                    value={newPriority.name}
                                                    onChange={(e) => setNewPriority({ ...newPriority, name: e.target.value })}
                                                    style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #dfe1e6', boxSizing: 'border-box' }}
                                                />
                                            </div>
                                            <div style={{ width: '100px' }}>
                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b778c', marginBottom: '4px' }}>
                                                    Color
                                                </label>
                                                <input
                                                    type="color"
                                                    value={newPriority.colorHex}
                                                    onChange={(e) => setNewPriority({ ...newPriority, colorHex: e.target.value })}
                                                    style={{ width: '100%', height: '36px', padding: '2px', borderRadius: '4px', border: '1px solid #dfe1e6', cursor: 'pointer' }}
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                style={{
                                                    backgroundColor: '#0052cc',
                                                    color: '#ffffff',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    padding: '9px 18px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Add Priority
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* TAB 4: LABELS */}
                            {activeTab === 'labels' && (
                                <div>
                                    <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#172b4d' }}>Labels & Tags</h2>
                                    <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#6b778c' }}>
                                        Project labels used for tagging, grouping, and filtering tasks on the board.
                                    </p>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '30px' }}>
                                        {config.labels.map(l => (
                                            <div key={l.id} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                backgroundColor: '#eae6ff',
                                                color: '#403294',
                                                borderRadius: '6px',
                                                padding: '6px 12px',
                                                fontSize: '13px',
                                                fontWeight: '600'
                                            }}>
                                                <span>🏷️ {l.name}</span>
                                                <span
                                                    onClick={() => handleDeleteLabel(l.id)}
                                                    style={{ cursor: 'pointer', color: '#de350b', fontWeight: 'bold' }}
                                                    title="Delete label"
                                                >
                                                    ✕
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add Label Form */}
                                    <form onSubmit={handleAddLabel} style={{
                                        backgroundColor: '#fafbfc',
                                        padding: '16px',
                                        borderRadius: '8px',
                                        border: '1px solid #ebecf0',
                                        display: 'flex',
                                        gap: '12px',
                                        alignItems: 'center'
                                    }}>
                                        <input
                                            type="text"
                                            required
                                            placeholder="New label name (e.g. Security, Database)..."
                                            value={newLabel.name}
                                            onChange={(e) => setNewLabel({ ...newLabel, name: e.target.value })}
                                            style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #dfe1e6' }}
                                        />
                                        <button
                                            type="submit"
                                            style={{
                                                backgroundColor: '#0052cc',
                                                color: '#ffffff',
                                                border: 'none',
                                                borderRadius: '4px',
                                                padding: '8px 16px',
                                                fontWeight: '600',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            + Add Label
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* TAB 5: COMPONENTS */}
                            {activeTab === 'components' && (
                                <div>
                                    <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#172b4d' }}>Project Components</h2>
                                    <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#6b778c' }}>
                                        Subsections or technical modules of the project (e.g. Authentication, Task Engine, UI).
                                    </p>

                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #ebecf0', color: '#5e6c84', fontSize: '13px' }}>
                                                <th style={{ padding: '10px' }}>Component Name</th>
                                                <th style={{ padding: '10px' }}>Description</th>
                                                <th style={{ padding: '10px' }}>Component Lead</th>
                                                <th style={{ padding: '10px' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {config.components.map(c => (
                                                <tr key={c.id} style={{ borderBottom: '1px solid #ebecf0', fontSize: '14px' }}>
                                                    <td style={{ padding: '12px 10px', fontWeight: '700', color: '#172b4d' }}>
                                                        📦 {c.name}
                                                    </td>
                                                    <td style={{ padding: '12px 10px', color: '#6b778c' }}>{c.description || '—'}</td>
                                                    <td style={{ padding: '12px 10px', color: '#0052cc' }}>{c.leadUserName || 'Unassigned'}</td>
                                                    <td style={{ padding: '12px 10px' }}>
                                                        <button
                                                            onClick={() => handleDeleteComponent(c.id)}
                                                            style={{
                                                                backgroundColor: '#ffebe6',
                                                                color: '#de350b',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                padding: '4px 8px',
                                                                cursor: 'pointer',
                                                                fontSize: '12px',
                                                                fontWeight: '600'
                                                            }}
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Add Component Form */}
                                    <form onSubmit={handleAddComponent} style={{
                                        backgroundColor: '#fafbfc',
                                        padding: '18px',
                                        borderRadius: '8px',
                                        border: '1px solid #ebecf0'
                                    }}>
                                        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#172b4d' }}>+ Add New Component</h4>
                                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                            <div style={{ flex: '1 1 200px' }}>
                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b778c', marginBottom: '4px' }}>
                                                    Name
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="Component name..."
                                                    value={newComponent.name}
                                                    onChange={(e) => setNewComponent({ ...newComponent, name: e.target.value })}
                                                    style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #dfe1e6', boxSizing: 'border-box' }}
                                                />
                                            </div>

                                            <div style={{ flex: '1 1 250px' }}>
                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b778c', marginBottom: '4px' }}>
                                                    Description
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Short summary..."
                                                    value={newComponent.description}
                                                    onChange={(e) => setNewComponent({ ...newComponent, description: e.target.value })}
                                                    style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #dfe1e6', boxSizing: 'border-box' }}
                                                />
                                            </div>

                                            <div style={{ width: '180px' }}>
                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b778c', marginBottom: '4px' }}>
                                                    Component Lead
                                                </label>
                                                <select
                                                    value={newComponent.leadUserId}
                                                    onChange={(e) => setNewComponent({ ...newComponent, leadUserId: e.target.value })}
                                                    style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #dfe1e6', boxSizing: 'border-box' }}
                                                >
                                                    <option value="">None</option>
                                                    {members.map(m => (
                                                        <option key={m.userId} value={m.userId}>{m.userName}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <button
                                                type="submit"
                                                style={{
                                                    backgroundColor: '#0052cc',
                                                    color: '#ffffff',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    padding: '9px 18px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Add Component
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* TAB 6: MEMBERS & ROLES */}
                            {activeTab === 'members' && (
                                <div>
                                    <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#172b4d' }}>Project Members & Roles</h2>
                                    <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#6b778c' }}>
                                        All registered team members and their access roles in the system.
                                    </p>

                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #ebecf0', color: '#5e6c84', fontSize: '13px' }}>
                                                <th style={{ padding: '10px' }}>User ID</th>
                                                <th style={{ padding: '10px' }}>User Name</th>
                                                <th style={{ padding: '10px' }}>Email</th>
                                                <th style={{ padding: '10px' }}>Role</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {members.map(m => (
                                                <tr key={m.userId} style={{ borderBottom: '1px solid #ebecf0', fontSize: '14px' }}>
                                                    <td style={{ padding: '12px 10px', color: '#6b778c' }}>#{m.userId}</td>
                                                    <td style={{ padding: '12px 10px', fontWeight: '700', color: '#172b4d' }}>{m.userName}</td>
                                                    <td style={{ padding: '12px 10px', color: '#5e6c84' }}>{m.email}</td>
                                                    <td style={{ padding: '12px 10px' }}>
                                                        <span style={{
                                                            padding: '2px 8px',
                                                            borderRadius: '10px',
                                                            fontSize: '11px',
                                                            fontWeight: '700',
                                                            backgroundColor: m.role === 'Admin' ? '#ffebe6' : '#deebff',
                                                            color: m.role === 'Admin' ? '#de350b' : '#0747a6'
                                                        }}>
                                                            {m.role}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* TAB 7: JIRA INTEGRATION CONFIGURATION */}
                            {activeTab === 'jira' && (
                                <div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '20px'
                                    }}>
                                        <div>
                                            <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', color: '#172b4d', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span>🔗</span> Jira Cloud Integration
                                            </h2>
                                            <p style={{ margin: 0, fontSize: '13px', color: '#6b778c' }}>
                                                Bidirectional synchronization with Atlassian Jira Cloud REST API v3.
                                            </p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <div style={{
                                                padding: '6px 12px',
                                                borderRadius: '20px',
                                                backgroundColor: jiraConfig.connectionStatus === 'Connected' ? '#e3fcef' : '#f4f5f7',
                                                color: jiraConfig.connectionStatus === 'Connected' ? '#006644' : '#6b778c',
                                                fontSize: '12px',
                                                fontWeight: '700'
                                            }}>
                                                {jiraConfig.connectionStatus === 'Connected' ? '● Connected' : '○ Disconnected'}
                                            </div>
                                            {jiraConfig.autoSync && (
                                                <span style={{ fontSize: '11px', backgroundColor: '#deebff', color: '#0747a6', padding: '3px 8px', borderRadius: '10px', fontWeight: '700' }}>
                                                    AutoSync Active
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {jiraMessage && (
                                        <div style={{
                                            padding: '12px 16px',
                                            backgroundColor: '#e3fcef',
                                            color: '#006644',
                                            borderRadius: '6px',
                                            border: '1px solid #abf5d1',
                                            marginBottom: '20px',
                                            fontSize: '13px',
                                            fontWeight: '600'
                                        }}>
                                            ✓ {jiraMessage}
                                        </div>
                                    )}

                                    {testResult && (
                                        <div style={{
                                            padding: '12px 16px',
                                            backgroundColor: testResult.success ? '#e3fcef' : 'rgba(239, 68, 68, 0.1)',
                                            color: testResult.success ? '#006644' : '#ef4444',
                                            borderRadius: '6px',
                                            border: `1px solid ${testResult.success ? '#abf5d1' : '#fca5a5'}`,
                                            marginBottom: '20px',
                                            fontSize: '13px',
                                            fontWeight: '600'
                                        }}>
                                            {testResult.success ? '✓' : '⚠️'} {testResult.message}
                                        </div>
                                    )}

                                    {syncResult && (
                                        <div style={{
                                            padding: '12px 16px',
                                            backgroundColor: syncResult.success ? '#e3fcef' : 'rgba(239, 68, 68, 0.1)',
                                            color: syncResult.success ? '#006644' : '#ef4444',
                                            borderRadius: '6px',
                                            border: `1px solid ${syncResult.success ? '#abf5d1' : '#fca5a5'}`,
                                            marginBottom: '20px',
                                            fontSize: '13px',
                                            fontWeight: '600'
                                        }}>
                                            {syncResult.success ? '✓' : '⚠️'} {syncResult.message}
                                            {syncResult.success && (
                                                <div style={{ fontSize: '12px', fontWeight: 'normal', marginTop: '4px' }}>
                                                    Pushed to Jira: <strong>{syncResult.pushed || 0}</strong> | Imported from Jira: <strong>{syncResult.imported || 0}</strong>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Action Bar (Test Connection, Sync Now, Disconnect) */}
                                    <div style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: '12px',
                                        padding: '16px',
                                        backgroundColor: '#f8fafc',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        marginBottom: '24px',
                                        alignItems: 'center',
                                        justifyContent: 'space-between'
                                    }}>
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>
                                                Integration Actions
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                                                {jiraConfig.lastSyncedAt
                                                    ? `Last synced: ${new Date(jiraConfig.lastSyncedAt).toLocaleString()}`
                                                    : 'Never synced'}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                                type="button"
                                                onClick={handleTestConnection}
                                                disabled={testingConnection || jiraLoading}
                                                style={{
                                                    padding: '8px 16px',
                                                    backgroundColor: '#ffffff',
                                                    border: '1px solid #cbd5e1',
                                                    borderRadius: '6px',
                                                    color: '#334155',
                                                    fontWeight: '600',
                                                    fontSize: '13px',
                                                    cursor: testingConnection ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                {testingConnection ? 'Testing...' : '⚡ Test Connection'}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={handleSyncNow}
                                                disabled={syncingNow || jiraLoading}
                                                style={{
                                                    padding: '8px 16px',
                                                    backgroundColor: '#305CDE',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    color: '#ffffff',
                                                    fontWeight: '600',
                                                    fontSize: '13px',
                                                    cursor: syncingNow ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                {syncingNow ? 'Syncing...' : '🔄 Sync Now'}
                                            </button>

                                            {jiraConfig.isConfigured && (
                                                <button
                                                    type="button"
                                                    onClick={handleDisconnectJira}
                                                    disabled={jiraLoading}
                                                    style={{
                                                        padding: '8px 14px',
                                                        backgroundColor: 'transparent',
                                                        border: '1px solid #fca5a5',
                                                        borderRadius: '6px',
                                                        color: '#ef4444',
                                                        fontWeight: '600',
                                                        fontSize: '13px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Disconnect
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Configuration Form */}
                                    <form onSubmit={handleSaveJira} style={{
                                        backgroundColor: '#fafbfc',
                                        padding: '24px',
                                        borderRadius: '8px',
                                        border: '1px solid #ebecf0',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '20px',
                                        marginBottom: '30px'
                                    }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#172b4d', marginBottom: '6px' }}>
                                                Jira Base URL <span style={{ color: '#ef4444' }}>*</span>
                                            </label>
                                            <input
                                                type="url"
                                                required
                                                placeholder="https://your-domain.atlassian.net"
                                                value={jiraConfig.jiraBaseUrl}
                                                onChange={(e) => setJiraConfig({ ...jiraConfig, jiraBaseUrl: e.target.value })}
                                                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #dfe1e6', boxSizing: 'border-box' }}
                                            />
                                            <span style={{ fontSize: '12px', color: '#6b778c' }}>Your organization's Atlassian Cloud domain.</span>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#172b4d', marginBottom: '6px' }}>
                                                    User Email <span style={{ color: '#ef4444' }}>*</span>
                                                </label>
                                                <input
                                                    type="email"
                                                    required
                                                    placeholder="developer@your-company.com"
                                                    value={jiraConfig.userEmail}
                                                    onChange={(e) => setJiraConfig({ ...jiraConfig, userEmail: e.target.value })}
                                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #dfe1e6', boxSizing: 'border-box' }}
                                                />
                                                <span style={{ fontSize: '12px', color: '#6b778c' }}>Email associated with your Atlassian account.</span>
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#172b4d', marginBottom: '6px' }}>
                                                    Jira Project Key <span style={{ color: '#ef4444' }}>*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="e.g. TMS, KAN, PROJ"
                                                    value={jiraConfig.projectKey}
                                                    onChange={(e) => setJiraConfig({ ...jiraConfig, projectKey: e.target.value.toUpperCase() })}
                                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #dfe1e6', boxSizing: 'border-box' }}
                                                />
                                                <span style={{ fontSize: '12px', color: '#6b778c' }}>Target project key in Jira Cloud.</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#172b4d', marginBottom: '6px' }}>
                                                Jira API Token {jiraConfig.maskedApiToken && <span style={{ color: '#10b981', fontSize: '11px', fontWeight: 'normal' }}>({jiraConfig.maskedApiToken} configured)</span>}
                                            </label>
                                            <input
                                                type="password"
                                                placeholder={jiraConfig.maskedApiToken ? "Enter new token to overwrite existing" : "Paste your Atlassian API token"}
                                                value={jiraConfig.apiToken}
                                                onChange={(e) => setJiraConfig({ ...jiraConfig, apiToken: e.target.value })}
                                                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #dfe1e6', boxSizing: 'border-box' }}
                                            />
                                            <span style={{ fontSize: '12px', color: '#6b778c' }}>Generate an API token from your Atlassian Security account settings.</span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                                            <input
                                                type="checkbox"
                                                id="autoSyncToggle"
                                                checked={jiraConfig.autoSync}
                                                onChange={(e) => setJiraConfig({ ...jiraConfig, autoSync: e.target.checked })}
                                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                            />
                                            <label htmlFor="autoSyncToggle" style={{ fontSize: '14px', fontWeight: '600', color: '#172b4d', cursor: 'pointer' }}>
                                                Enable Auto-Sync (synchronize updates automatically when tasks are changed)
                                            </label>
                                        </div>

                                        {jiraConfig.webhookUrl && (
                                            <div style={{
                                                padding: '12px 16px',
                                                backgroundColor: '#f1f5f9',
                                                borderRadius: '6px',
                                                border: '1px solid #e2e8f0',
                                                fontSize: '12px'
                                            }}>
                                                <div style={{ fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                                                    Webhook Endpoint URL (Jira System Webhooks)
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <code style={{ flex: 1, backgroundColor: '#ffffff', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', color: '#475569' }}>
                                                        {jiraConfig.webhookUrl}
                                                    </code>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigator.clipboard.writeText(jiraConfig.webhookUrl)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            backgroundColor: '#ffffff',
                                                            border: '1px solid #cbd5e1',
                                                            borderRadius: '4px',
                                                            fontSize: '12px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Copy
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                                            <button
                                                type="submit"
                                                disabled={jiraLoading}
                                                style={{
                                                    backgroundColor: '#305CDE',
                                                    color: '#ffffff',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    padding: '11px 24px',
                                                    fontSize: '14px',
                                                    fontWeight: '700',
                                                    cursor: jiraLoading ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                {jiraLoading ? 'Saving...' : 'Save Jira Settings'}
                                            </button>
                                        </div>
                                    </form>

                                    {/* Sync Activity Logs Table */}
                                    <div>
                                        <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#172b4d' }}>
                                            Recent Jira Synchronization Logs
                                        </h3>
                                        {jiraLogs.length === 0 ? (
                                            <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '6px', color: '#94a3b8', fontSize: '13px' }}>
                                                No sync logs recorded yet. Use "Sync Now" to perform your first synchronization.
                                            </div>
                                        ) : (
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                                <thead>
                                                    <tr style={{ textAlign: 'left', borderBottom: '2px solid #ebecf0', color: '#5e6c84' }}>
                                                        <th style={{ padding: '10px' }}>Time</th>
                                                        <th style={{ padding: '10px' }}>Type</th>
                                                        <th style={{ padding: '10px' }}>Status</th>
                                                        <th style={{ padding: '10px' }}>Pushed</th>
                                                        <th style={{ padding: '10px' }}>Imported</th>
                                                        <th style={{ padding: '10px' }}>Initiated By</th>
                                                        <th style={{ padding: '10px' }}>Details</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {jiraLogs.map(log => (
                                                        <tr key={log.id} style={{ borderBottom: '1px solid #ebecf0' }}>
                                                            <td style={{ padding: '10px', color: '#64748b' }}>
                                                                {new Date(log.startedAt).toLocaleString()}
                                                            </td>
                                                            <td style={{ padding: '10px', fontWeight: '600' }}>
                                                                {log.syncType}
                                                            </td>
                                                            <td style={{ padding: '10px' }}>
                                                                <span style={{
                                                                    padding: '2px 8px',
                                                                    borderRadius: '10px',
                                                                    fontSize: '11px',
                                                                    fontWeight: '700',
                                                                    backgroundColor: log.status === 'Success' ? '#e3fcef' : 'rgba(239, 68, 68, 0.1)',
                                                                    color: log.status === 'Success' ? '#006644' : '#ef4444'
                                                                }}>
                                                                    {log.status}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '10px' }}>{log.tasksPushed}</td>
                                                            <td style={{ padding: '10px' }}>{log.tasksImported}</td>
                                                            <td style={{ padding: '10px', color: '#64748b' }}>{log.initiatedBy || 'System'}</td>
                                                            <td style={{ padding: '10px', color: log.errorMessage ? '#ef4444' : '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.errorMessage || 'Completed successfully'}>
                                                                {log.errorMessage || 'Success'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectSettings;


