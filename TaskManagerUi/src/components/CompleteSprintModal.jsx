import React, { useState } from 'react';
import PropTypes from 'prop-types';
import api from '../Api/Axios';

const CompleteSprintModal = ({ sprint, futureSprints, onClose, onSprintCompleted }) => {
    const [targetSprintId, setTargetSprintId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const completedCount = sprint.completedIssues || 0;
    const incompleteCount = (sprint.totalIssues || 0) - completedCount;

    const handleComplete = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            await api.post(`/sprint/${sprint.id}/complete`, {
                moveUnfinishedToSprintId: targetSprintId ? parseInt(targetSprintId) : null
            });
            onSprintCompleted();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || err.userFriendlyMessage || 'Failed to complete sprint.');
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
                        🏁 Complete Sprint: {sprint.name}
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
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderBottom: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#dc2626',
                        fontSize: '13px',
                        fontWeight: '600'
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleComplete} style={{ padding: '20px' }}>
                    <div style={{
                        backgroundColor: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        padding: '12px 14px',
                        borderRadius: '6px',
                        marginBottom: '16px',
                        fontSize: '13px',
                        color: '#047857'
                    }}>
                        ✓ <strong style={{ color: '#065f46' }}>{completedCount} completed issues</strong> will be closed.
                    </div>

                    {incompleteCount > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{
                                backgroundColor: '#fffbeb',
                                border: '1px solid #fde68a',
                                padding: '12px 14px',
                                borderRadius: '6px',
                                marginBottom: '14px',
                                fontSize: '13px',
                                color: '#b45309'
                            }}>
                                ⚠️ <strong style={{ color: '#92400e' }}>{incompleteCount} incomplete issues</strong> remain in this sprint.
                            </div>

                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#243c5a', marginBottom: '6px' }}>
                                Move open issues to:
                            </label>
                            <select
                                value={targetSprintId}
                                onChange={(e) => setTargetSprintId(e.target.value)}
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
                                <option value="">Backlog (Unscheduled)</option>
                                {futureSprints.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} (Future Sprint)
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

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
                                backgroundColor: '#16a34a',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                opacity: loading ? 0.7 : 1,
                                boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)'
                            }}
                        >
                            {loading ? 'Completing...' : 'Complete Sprint'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

CompleteSprintModal.propTypes = {
    sprint: PropTypes.object.isRequired,
    futureSprints: PropTypes.array.isRequired,
    onClose: PropTypes.func.isRequired,
    onSprintCompleted: PropTypes.func.isRequired
};

export default CompleteSprintModal;
