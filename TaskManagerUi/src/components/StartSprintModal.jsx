import React, { useState } from 'react';
import PropTypes from 'prop-types';
import api from '../Api/Axios';

const StartSprintModal = ({ sprint, onClose, onSprintStarted }) => {
    const today = new Date().toISOString().split('T')[0];
    const twoWeeksLater = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [startDate, setStartDate] = useState(sprint.startDate ? sprint.startDate.split('T')[0] : today);
    const [endDate, setEndDate] = useState(sprint.endDate ? sprint.endDate.split('T')[0] : twoWeeksLater);
    const [duration, setDuration] = useState('2weeks');
    const [goal, setGoal] = useState(sprint.goal || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleDurationChange = (val) => {
        setDuration(val);
        const start = new Date(startDate || today);
        let days = 14;
        if (val === '1week') days = 7;
        else if (val === '2weeks') days = 14;
        else if (val === '3weeks') days = 21;
        else if (val === '4weeks') days = 28;

        if (val !== 'custom') {
            const calculatedEnd = new Date(start.getTime() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            setEndDate(calculatedEnd);
        }
    };

    const handleStart = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            await api.post(`/sprint/${sprint.id}/start`, {
                startDate: new Date(startDate).toISOString(),
                endDate: new Date(endDate).toISOString(),
                goal: goal.trim() || null
            });
            onSprintStarted();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || err.userFriendlyMessage || 'Failed to start sprint.');
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
                        ⚡ Start Sprint: {sprint.name}
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
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171',
                        fontSize: '13px',
                        fontWeight: '600'
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleStart} style={{ padding: '20px' }}>
                    <div style={{ marginBottom: '14px', fontSize: '13px', color: '#94a3b8' }}>
                        Starting this sprint will activate it on the Kanban board.
                        There are <strong style={{ color: '#f8fafc' }}>{sprint.issues?.length || 0} issues</strong> ({sprint.totalStoryPoints || 0} story points) planned.
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#94a3b8', marginBottom: '4px' }}>
                            Duration
                        </label>
                        <select
                            value={duration}
                            onChange={(e) => handleDurationChange(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 10px',
                                borderRadius: '6px',
                                backgroundColor: '#ffffff',
                                color: '#0f172a',
                                border: '1px solid #cbdcf7',
                                fontSize: '13px'
                            }}
                        >
                            <option value="1week">1 week</option>
                            <option value="2weeks">2 weeks (standard)</option>
                            <option value="3weeks">3 weeks</option>
                            <option value="4weeks">4 weeks</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#243c5a', marginBottom: '4px' }}>
                                Start Date
                            </label>
                            <input
                                type="date"
                                required
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
                                required
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

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#243c5a', marginBottom: '4px' }}>
                            Sprint Goal
                        </label>
                        <textarea
                            rows="3"
                            placeholder="What do we want to achieve?"
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
                            {loading ? 'Starting...' : 'Start'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

StartSprintModal.propTypes = {
    sprint: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired,
    onSprintStarted: PropTypes.func.isRequired
};

export default StartSprintModal;
