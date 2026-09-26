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
            setError(err.response?.data?.message || 'Failed to complete sprint.');
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
                        🏁 Complete Sprint: {sprint.name}
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6b778c' }}>✕</button>
                </div>

                {error && (
                    <div style={{ padding: '10px 20px', backgroundColor: '#ffebe6', color: '#de350b', fontSize: '13px' }}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleComplete} style={{ padding: '20px' }}>
                    <div style={{ marginBottom: '16px', lineHeight: '1.6', fontSize: '14px', color: '#172b4d' }}>
                        <div>✅ <strong>{completedCount}</strong> issue(s) completed</div>
                        {incompleteCount > 0 ? (
                            <div style={{ color: '#de350b', marginTop: '6px' }}>
                                ⚠️ <strong>{incompleteCount}</strong> issue(s) incomplete
                            </div>
                        ) : (
                            <div style={{ color: '#006644', marginTop: '6px' }}>
                                🎉 All issues in this sprint were completed!
                            </div>
                        )}
                    </div>

                    {incompleteCount > 0 && (
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b778c', marginBottom: '6px' }}>
                                Move incomplete issues to:
                            </label>
                            <select
                                value={targetSprintId}
                                onChange={(e) => setTargetSprintId(e.target.value)}
                                style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #dfe1e6', fontSize: '14px' }}
                            >
                                <option value="">Backlog (Default)</option>
                                {futureSprints.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} (Upcoming Sprint)</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                        <button type="button" onClick={onClose} style={{ padding: '8px 16px', background: 'none', border: '1px solid #dfe1e6', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', color: '#42526e' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} style={{ padding: '8px 20px', backgroundColor: '#00875a', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', opacity: loading ? 0.7 : 1 }}>
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
