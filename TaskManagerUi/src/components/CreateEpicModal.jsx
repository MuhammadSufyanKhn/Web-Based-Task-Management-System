import React, { useState } from 'react';
import PropTypes from 'prop-types';
import api from '../Api/Axios';

const EPIC_COLORS = ['#8777D9', '#0052CC', '#00875A', '#FF7452', '#FFAB00', '#DE350B', '#5243AA', '#00B8D9'];

const CreateEpicModal = ({ onClose, onEpicCreated }) => {
    const [name, setName] = useState('');
    const [summary, setSummary] = useState('');
    const [colorHex, setColorHex] = useState('#8777D9');
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
            setError(err.response?.data?.message || 'Failed to create epic.');
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
                        ⚡ Create Epic
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6b778c' }}>✕</button>
                </div>

                {error && (
                    <div style={{ padding: '10px 20px', backgroundColor: '#ffebe6', color: '#de350b', fontSize: '13px' }}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
                    <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b778c', marginBottom: '4px' }}>
                            Epic Name <span style={{ color: 'red' }}>*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. User Authentication & SSO"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #dfe1e6', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b778c', marginBottom: '4px' }}>
                            Summary / Goal
                        </label>
                        <textarea
                            rows="3"
                            placeholder="Provide a high-level summary of this epic..."
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            style={{ width: '100%', padding: '8px 12px', borderRadius: '4px', border: '1px solid #dfe1e6', boxSizing: 'border-box', fontFamily: 'inherit' }}
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b778c', marginBottom: '6px' }}>
                            Epic Color
                        </label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            {EPIC_COLORS.map(c => (
                                <div
                                    key={c}
                                    onClick={() => setColorHex(c)}
                                    style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '4px',
                                        backgroundColor: c,
                                        cursor: 'pointer',
                                        border: colorHex === c ? '2px solid #000' : '2px solid transparent',
                                        transform: colorHex === c ? 'scale(1.15)' : 'scale(1)',
                                        transition: 'transform 0.1s'
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b778c', marginBottom: '4px' }}>
                                Start Date (Optional)
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #dfe1e6', boxSizing: 'border-box' }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#6b778c', marginBottom: '4px' }}>
                                Target Due Date (Optional)
                            </label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #dfe1e6', boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={onClose} style={{ padding: '8px 16px', background: 'none', border: '1px solid #dfe1e6', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', color: '#42526e' }}>
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} style={{ padding: '8px 20px', backgroundColor: '#8777D9', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', opacity: loading ? 0.7 : 1 }}>
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
