import React, { useState } from 'react';
import PropTypes from 'prop-types';
import api from '../Api/Axios';

const CreateSprintModal = ({ onClose, onSprintCreated, defaultSprintNumber }) => {
    const [name, setName] = useState(`Sprint ${defaultSprintNumber || 1}`);
    const [goal, setGoal] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Sprint name is required.');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            await api.post('/sprint', {
                name: name.trim(),
                goal: goal.trim() || null,
                startDate: startDate ? new Date(startDate).toISOString() : null,
                endDate: endDate ? new Date(endDate).toISOString() : null
            });
            onSprintCreated();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || err.userFriendlyMessage || 'Failed to create sprint.');
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
                boxShadow: '0 20px 48px rgba(15, 23, 42, 0.16)',
                overflow: 'hidden',
                color: '#0f172a'
            }}>
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #cbdcf7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#f8fafd'
                }}>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>
                        🏃 Create Sprint
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            fontSize: '18px',
                            cursor: 'pointer',
                            color: '#64748b'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {error && (
                    <div style={{
                        padding: '10px 20px',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171',
                        fontSize: '13px',
                        fontWeight: '600'
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#243c5a', marginBottom: '4px' }}>
                            Sprint Name <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            type="text"
                            required
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
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#243c5a', marginBottom: '4px' }}>
                            Sprint Goal
                        </label>
                        <textarea
                            rows="3"
                            placeholder="What do we want to achieve in this sprint?"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
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

                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#243c5a', marginBottom: '4px' }}>
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
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#243c5a', marginBottom: '4px' }}>
                                End Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
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

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #cbdcf7', paddingTop: '16px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: 'transparent',
                                border: '1px solid #cbdcf7',
                                borderRadius: '6px',
                                color: '#64748b',
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
                                background: '#1d4ed8',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                boxShadow: '0 2px 6px rgba(29, 78, 216, 0.3)',
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

CreateSprintModal.propTypes = {
    onClose: PropTypes.func.isRequired,
    onSprintCreated: PropTypes.func.isRequired,
    defaultSprintNumber: PropTypes.number
};

export default CreateSprintModal;
