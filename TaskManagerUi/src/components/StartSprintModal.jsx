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
            setError(err.response?.data?.message || 'Failed to start sprint.');
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
            backgroundColor: 'rgba(9, 30, 66, 0.54)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(3px)',
            padding: '20px'
        }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '10px',
                width: '100%',
                maxWidth: '520px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
                overflow: 'hidden'
            }}>
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #ebecf0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#fafbfc'
                }}>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#172b4d' }}>
                        🚀 Start Sprint: {sprint.name}
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6b778c' }}>✕</button>
                </div>

                {error && (
                    <div style={{ padding: '10px 20px', backgroundColor: '#ffebe6', color: '#de350b', fontSize: '13px' }}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleStart} style={{ padding: '20px' }}>
                    <div style={{
                        padding: '10px 14px',
                        backgroundColor: '#deebff',
                        color: '#0747a6',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600',
                        marginBottom: '16px'
                    }}>
                        📊 Contains {sprint.totalIssues || 0} issues ({sprint.totalStoryPoints || 0} story points)
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b778c', marginBottom: '4px' }}>
                            Duration
                        </label>
                        <select
                            value={duration}
                            onChange={(e) => handleDurationChange(e.target.value)}
                            style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #dfe1e6' }}
                        >
                            <option value="1week">1 week</option>
                            <option value="2weeks">2 weeks (Default)</option>
                            <option value="3weeks">3 weeks</option>
                            <option value="4weeks">4 weeks</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b778c', marginBottom: '4px' }}>
                                Start Date
                            </label>
                            <input
                                type="date"
                                required
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #dfe1e6', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b778c', marginBottom: '4px' }}>
                                End Date
                            </label>
                            <input
                                type="date"
                                required
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #dfe1e6', boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b778c', marginBottom: '4px' }}>
                            Sprint Goal
                        </label>
                        <textarea
                            rows="3"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            placeholder="What do you plan to achieve during this sprint?"
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #dfe1e6', boxSizing: 'border-box', fontFamily: 'inherit' }}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={onClose} style={{ padding: '8px 16px', background: 'none', border: '1px solid #dfe1e6', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', color: '#42526e' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} style={{ padding: '8px 20px', backgroundColor: '#0052cc', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', opacity: loading ? 0.7 : 1 }}>
                            {loading ? 'Starting...' : 'Start Sprint'}
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
