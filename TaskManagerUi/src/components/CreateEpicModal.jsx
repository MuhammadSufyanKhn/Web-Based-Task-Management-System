import React, { useState } from 'react';
import PropTypes from 'prop-types';
import api from '../Api/Axios';

const EPIC_COLORS = ['#8b5cf6', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#3b82f6'];

const CreateEpicModal = ({ onClose, onEpicCreated }) => {
    const [name, setName] = useState('');
    const [summary, setSummary] = useState('');
    const [colorHex, setColorHex] = useState('#8b5cf6');
    const [startDate, setStartDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Epic name is required.');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            await api.post('/epic', {
                name: name.trim(),
                summary: summary.trim() || null,
                colorHex,
                startDate: startDate ? new Date(startDate).toISOString() : null,
                dueDate: dueDate ? new Date(dueDate).toISOString() : null
            });
            onEpicCreated();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || err.userFriendlyMessage || 'Failed to create epic.');
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(5px)',
            padding: '20px'
        }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #cbdcf7',
                borderRadius: '12px',
                width: '100%',
                maxWidth: '520px',
                boxShadow: '0 20px 40px -10px rgba(15, 23, 42, 0.25)',
                overflow: 'hidden',
                color: '#0f172a'
            }}>
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#f8fafd'
                }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e3a8a' }}>
                        ⚡ Create Epic
                    </h3>
                    <button
                        onClick={onClose}
                        style={{ background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
                    >
                        ✕
                    </button>
                </div>

                {error && (
                    <div style={{
                        padding: '10px 20px',
                        backgroundColor: '#fef2f2',
                        borderBottom: '1px solid #fecaca',
                        color: '#b91c1c',
                        fontSize: '13px',
                        fontWeight: '600'
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                            Epic Name <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. User Authentication Overhaul"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 10px',
                                borderRadius: '6px',
                                backgroundColor: '#ffffff',
                                color: '#0f172a',
                                border: '1px solid #cbdcf7',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                            Summary / Goal
                        </label>
                        <textarea
                            rows="3"
                            placeholder="High-level description of this epic initiative..."
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 10px',
                                borderRadius: '6px',
                                backgroundColor: '#ffffff',
                                color: '#0f172a',
                                border: '1px solid #cbdcf7',
                                fontSize: '13px',
                                boxSizing: 'border-box',
                                fontFamily: 'inherit'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                            Epic Color
                        </label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {EPIC_COLORS.map(c => (
                                <div
                                    key={c}
                                    onClick={() => setColorHex(c)}
                                    style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '6px',
                                        backgroundColor: c,
                                        cursor: 'pointer',
                                        border: colorHex === c ? '2px solid #1d4ed8' : '2px solid transparent',
                                        boxShadow: colorHex === c ? `0 0 8px ${c}` : 'none',
                                        transition: 'transform 0.1s ease',
                                        transform: colorHex === c ? 'scale(1.15)' : 'scale(1)'
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '8px 10px',
                                    borderRadius: '6px',
                                    backgroundColor: '#ffffff',
                                    color: '#0f172a',
                                    border: '1px solid #cbdcf7',
                                    fontSize: '13px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
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
                                    backgroundColor: '#ffffff',
                                    color: '#0f172a',
                                    border: '1px solid #cbdcf7',
                                    fontSize: '13px',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#f1f5f9',
                                border: '1px solid #cbdcf7',
                                borderRadius: '6px',
                                color: '#475569',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '8px 20px',
                                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? 'Creating...' : 'Create Epic'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

CreateEpicModal.propTypes = {
    onClose: PropTypes.func.isRequired,
    onEpicCreated: PropTypes.func.isRequired
};

export default CreateEpicModal;
