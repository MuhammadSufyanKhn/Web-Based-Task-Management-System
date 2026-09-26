import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../Api/Axios';
import AppNavbar from '../components/AppNavbar';

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
        isSyncEnabled: false,
        lastSyncDate: null
    });
    const [jiraLoading, setJiraLoading] = useState(false);
    const [jiraMessage, setJiraMessage] = useState('');

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
            const res = await api.get('/projectconfig/jira');
            setJiraConfig(res.data);
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
            const res = await api.put('/projectconfig/jira', jiraConfig);
            setJiraConfig(res.data);
            setJiraMessage('Jira configuration updated successfully.');
        } catch (err) {
            alert(err.response?.data?.message || err.response?.data || 'Failed to update Jira settings.');
        } finally {
            setJiraLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#0f172a',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <AppNavbar />
            {/* Top Bar */}
            <header style={{
                height: '56px',
                backgroundColor: '#172b4d',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 24px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '700' }}>
                    <span>⚙️</span> Project Settings & Configuration
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Link
                        to="/kanban"
                        style={{
                            color: '#ffffff',
                            textDecoration: 'none',
                            padding: '6px 14px',
                            backgroundColor: '#0052cc',
                            borderRadius: '4px',
                            fontSize: '13px',
                            fontWeight: '600'
                        }}
                    >
                        📋 Open Kanban Board
                    </Link>
                    <Link
                        to="/Admin-dashboard"
                        style={{
                            color: '#ffffff',
                            textDecoration: 'none',
                            padding: '6px 14px',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            borderRadius: '4px',
                            fontSize: '13px',
                            fontWeight: '600'
                        }}
                    >
                        Admin Dashboard
                    </Link>
                </div>
            </header>

            {/* Content Container */}
            <div style={{
                maxWidth: '1100px',
                width: '100%',
                margin: '30px auto',
                backgroundColor: '#ffffff',
                borderRadius: '10px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                overflow: 'hidden',
                display: 'flex',
                minHeight: '600px'
            }}>
                {/* Left Tabs Menu */}
                <div style={{
                    width: '240px',
                    backgroundColor: '#fafbfc',
                    borderRight: '1px solid #ebecf0',
                    padding: '20px 0'
                }}>
                    <div style={{ padding: '0 20px 15px 20px', fontSize: '12px', fontWeight: '700', color: '#6b778c', textTransform: 'uppercase' }}>
                        Settings
                    </div>
                    {[
                        { id: 'statuses', label: 'Columns & Statuses', icon: '📋' },
                        { id: 'issueTypes', label: 'Issue Types', icon: '🏷️' },
                        { id: 'priorities', label: 'Priorities', icon: '⚡' },
                        { id: 'labels', label: 'Labels', icon: '🔖' },
                        { id: 'components', label: 'Components', icon: '📦' },
                        { id: 'members', label: 'Members & Roles', icon: '👥' },
                        { id: 'jira', label: 'Jira Settings', icon: '🔗' }
                    ].map(tab => (
                        <div
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '12px 20px',
                                fontSize: '14px',
                                fontWeight: activeTab === tab.id ? '700' : '500',
                                color: activeTab === tab.id ? '#0052cc' : '#42526e',
                                backgroundColor: activeTab === tab.id ? '#ebf2ff' : 'transparent',
                                borderLeft: activeTab === tab.id ? '3px solid #0052cc' : '3px solid transparent',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </div>
                    ))}
                </div>

                {/* Right Tab Content */}
                <div style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ color: '#6b778c', textAlign: 'center', marginTop: '60px' }}>Loading configuration...</div>
                    ) : (
                        <>
                            {/* TAB 1: STATUSES */}
                            {activeTab === 'statuses' && (
                                <div>
                                    <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#172b4d' }}>Board Columns & Statuses</h2>
                                    <p style={{ margin: '0 0 24px 0', fontSize: '13px', color: '#6b778c' }}>
                                        Configure the workflow stages and columns shown on your Kanban board.
                                    </p>

                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', borderBottom: '2px solid #ebecf0', color: '#5e6c84', fontSize: '13px' }}>
                                                <th style={{ padding: '10px' }}>Order</th>
                                                <th style={{ padding: '10px' }}>Display Name</th>
                                                <th style={{ padding: '10px' }}>System Key</th>
                                                <th style={{ padding: '10px' }}>Category</th>
                                                <th style={{ padding: '10px' }}>Color</th>
                                                <th style={{ padding: '10px' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {config.statuses.map(s => (
                                                <tr key={s.id} style={{ borderBottom: '1px solid #ebecf0', fontSize: '14px' }}>
                                                    <td style={{ padding: '12px 10px', fontWeight: 'bold' }}>{s.orderIndex}</td>
                                                    <td style={{ padding: '12px 10px', fontWeight: '600', color: '#172b4d' }}>
                                                        {s.displayName} {s.isDefault && <span style={{ fontSize: '11px', color: '#0052cc' }}>(Default)</span>}
                                                    </td>
                                                    <td style={{ padding: '12px 10px', color: '#6b778c' }}><code>{s.name}</code></td>
                                                    <td style={{ padding: '12px 10px' }}>
                                                        <span style={{
                                                            padding: '2px 8px',
                                                            borderRadius: '10px',
                                                            fontSize: '11px',
                                                            fontWeight: '600',
                                                            backgroundColor: s.category === 'Done' ? '#e3fcef' : '#deebff',
                                                            color: s.category === 'Done' ? '#006644' : '#0747a6'
                                                        }}>
                                                            {s.category}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 10px' }}>
                                                        <span style={{
                                                            display: 'inline-block',
                                                            width: '18px',
                                                            height: '18px',
                                                            borderRadius: '4px',
                                                            backgroundColor: s.colorHex,
                                                            verticalAlign: 'middle',
                                                            marginRight: '6px'
                                                        }} />
                                                        {s.colorHex}
                                                    </td>
                                                    <td style={{ padding: '12px 10px' }}>
                                                        <button
                                                            onClick={() => handleDeleteStatus(s.id)}
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

                                    {/* Add Status Form */}
                                    <form onSubmit={handleAddStatus} style={{
                                        backgroundColor: '#fafbfc',
                                        padding: '18px',
                                        borderRadius: '8px',
                                        border: '1px solid #ebecf0'
                                    }}>
                                        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#172b4d' }}>+ Add New Column / Status</h4>
                                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                                            <div style={{ flex: '1 1 180px' }}>
                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b778c', marginBottom: '4px' }}>
                                                    Display Name
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="e.g. In QA / Testing"
                                                    value={newStatus.displayName}
                                                    onChange={(e) => setNewStatus({ ...newStatus, displayName: e.target.value })}
                                                    style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #dfe1e6', boxSizing: 'border-box' }}
                                                />
                                            </div>

                                            <div style={{ width: '140px' }}>
                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b778c', marginBottom: '4px' }}>
                                                    Category
                                                </label>
                                                <select
                                                    value={newStatus.category}
                                                    onChange={(e) => setNewStatus({ ...newStatus, category: e.target.value })}
                                                    style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #dfe1e6', boxSizing: 'border-box' }}
                                                >
                                                    <option value="Todo">Todo</option>
                                                    <option value="InProgress">InProgress</option>
                                                    <option value="Done">Done</option>
                                                </select>
                                            </div>

                                            <div style={{ width: '110px' }}>
                                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#6b778c', marginBottom: '4px' }}>
                                                    Color
                                                </label>
                                                <input
                                                    type="color"
                                                    value={newStatus.colorHex}
                                                    onChange={(e) => setNewStatus({ ...newStatus, colorHex: e.target.value })}
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
                                        marginBottom: '16px'
                                    }}>
                                        <div>
                                            <h2 style={{ margin: '0 0 6px 0', fontSize: '20px', color: '#172b4d' }}>
                                                Jira Cloud Integration
                                            </h2>
                                            <p style={{ margin: 0, fontSize: '13px', color: '#6b778c' }}>
                                                Configure connection parameters for synchronization with Atlassian Jira Cloud.
                                            </p>
                                        </div>
                                        <div style={{
                                            padding: '6px 12px',
                                            borderRadius: '20px',
                                            backgroundColor: jiraConfig.isSyncEnabled ? '#e3fcef' : '#f4f5f7',
                                            color: jiraConfig.isSyncEnabled ? '#006644' : '#6b778c',
                                            fontSize: '12px',
                                            fontWeight: '700'
                                        }}>
                                            {jiraConfig.isSyncEnabled ? '● Sync Enabled' : '○ Sync Inactive'}
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

                                    <div style={{
                                        backgroundColor: '#ebf2ff',
                                        border: '1px solid #b3d4ff',
                                        borderRadius: '8px',
                                        padding: '16px',
                                        marginBottom: '24px'
                                    }}>
                                        <div style={{ fontWeight: '700', fontSize: '14px', color: '#0052cc', marginBottom: '6px' }}>
                                            ℹ️ Prepared for Next Phase
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#172b4d', lineHeight: '1.5' }}>
                                            The database tables and local hierarchy mapping are fully prepared. Storing your Jira API credentials allows the system to validate connectivity. Live bidirectional webhook synchronization will execute in Phase 4.
                                        </div>
                                    </div>

                                    <form onSubmit={handleSaveJira} style={{
                                        backgroundColor: '#fafbfc',
                                        padding: '24px',
                                        borderRadius: '8px',
                                        border: '1px solid #ebecf0',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '20px'
                                    }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#172b4d', marginBottom: '6px' }}>
                                                Jira Base URL
                                            </label>
                                            <input
                                                type="url"
                                                placeholder="https://your-company.atlassian.net"
                                                value={jiraConfig.jiraBaseUrl}
                                                onChange={(e) => setJiraConfig({ ...jiraConfig, jiraBaseUrl: e.target.value })}
                                                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #dfe1e6', boxSizing: 'border-box' }}
                                            />
                                            <span style={{ fontSize: '12px', color: '#6b778c' }}>Your organization's Atlassian Cloud domain.</span>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#172b4d', marginBottom: '6px' }}>
                                                    User Email
                                                </label>
                                                <input
                                                    type="email"
                                                    placeholder="developer@your-company.com"
                                                    value={jiraConfig.userEmail}
                                                    onChange={(e) => setJiraConfig({ ...jiraConfig, userEmail: e.target.value })}
                                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #dfe1e6', boxSizing: 'border-box' }}
                                                />
                                                <span style={{ fontSize: '12px', color: '#6b778c' }}>Email associated with your Atlassian account.</span>
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#172b4d', marginBottom: '6px' }}>
                                                    Jira Project Key
                                                </label>
                                                <input
                                                    type="text"
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
                                                Jira API Token
                                            </label>
                                            <input
                                                type="password"
                                                placeholder={jiraConfig.apiToken ? "••••••••" : "Paste your Atlassian API token"}
                                                value={jiraConfig.apiToken}
                                                onChange={(e) => setJiraConfig({ ...jiraConfig, apiToken: e.target.value })}
                                                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #dfe1e6', boxSizing: 'border-box' }}
                                            />
                                            <span style={{ fontSize: '12px', color: '#6b778c' }}>Generate an API token from your Atlassian Security account settings.</span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                                            <input
                                                type="checkbox"
                                                id="syncToggle"
                                                checked={jiraConfig.isSyncEnabled}
                                                onChange={(e) => setJiraConfig({ ...jiraConfig, isSyncEnabled: e.target.checked })}
                                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                            />
                                            <label htmlFor="syncToggle" style={{ fontSize: '14px', fontWeight: '600', color: '#172b4d', cursor: 'pointer' }}>
                                                Enable Sync Engine for this Workspace
                                            </label>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                                            <button
                                                type="submit"
                                                disabled={jiraLoading}
                                                style={{
                                                    backgroundColor: '#0052cc',
                                                    color: '#ffffff',
                                                    border: 'none',
                                                    borderRadius: '6px',
                                                    padding: '11px 24px',
                                                    fontSize: '14px',
                                                    fontWeight: '700',
                                                    cursor: jiraLoading ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                {jiraLoading ? 'Saving Settings...' : 'Save Jira Configuration'}
                                            </button>
                                        </div>
                                    </form>
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
