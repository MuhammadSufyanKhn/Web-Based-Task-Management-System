import React from 'react';

const AuthHeroVisual = ({ title = "Welcome to Task Management System", subtitle = "Empower your engineering teams with Jira-inspired workflows, real-time Kanban boards, sprint tracking, and automated velocity analytics." }) => {
    return (
        <div style={{
            flex: '1 1 50%',
            background: 'linear-gradient(145deg, #1b3593 0%, #305CDE 50%, #4670ea 100%)',
            padding: '48px 40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxSizing: 'border-box'
        }}>
            {/* Ambient Background Glows */}
            <div style={{
                position: 'absolute',
                top: '-10%',
                left: '-10%',
                width: '400px',
                height: '400px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%)',
                filter: 'blur(40px)',
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-10%',
                right: '-10%',
                width: '420px',
                height: '420px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(96, 165, 250, 0.25) 0%, transparent 70%)',
                filter: 'blur(50px)',
                pointerEvents: 'none'
            }} />

            <div style={{ maxWidth: '520px', width: '100%', zIndex: 1 }}>
                {/* Brand Pill */}
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(255, 255, 255, 0.18)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: '#ffffff',
                    fontSize: '12px',
                    fontWeight: '700',
                    letterSpacing: '0.5px',
                    marginBottom: '20px',
                    textTransform: 'uppercase'
                }}>
                    <span>⚡ Enterprise Agile Platform</span>
                </div>

                {/* Main Heading */}
                <h1 style={{
                    fontSize: '32px',
                    fontWeight: '800',
                    color: '#ffffff',
                    lineHeight: '1.25',
                    margin: '0 0 16px 0',
                    letterSpacing: '-0.5px'
                }}>
                    {title}
                </h1>

                {/* Subtitle */}
                <p style={{
                    fontSize: '15px',
                    color: '#e0e7ff',
                    lineHeight: '1.6',
                    margin: '0 0 32px 0'
                }}>
                    {subtitle}
                </p>

                {/* SaaS Visual Card Preview */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '16px',
                    border: '1px solid #bfdbfe',
                    boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
                    padding: '20px',
                    marginBottom: '28px'
                }}>
                    {/* Mock App Window Header */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingBottom: '14px',
                        borderBottom: '1px solid #e2e8f0',
                        marginBottom: '16px'
                    }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                        </div>
                        <div style={{
                            fontSize: '11px',
                            color: '#305CDE',
                            fontWeight: '700',
                            letterSpacing: '0.4px'
                        }}>
                            SPRINT 4 • KANBAN BOARD
                        </div>
                        <div style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: '#dcfce7',
                            color: '#16a34a',
                            fontWeight: '700'
                        }}>
                            Active
                        </div>
                    </div>

                    {/* Columns Preview */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        {/* Column 1: To Do */}
                        <div style={{
                            backgroundColor: '#f8fafd',
                            borderRadius: '10px',
                            padding: '10px',
                            border: '1px solid #e2e8f0'
                        }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
                                TO DO <span style={{ opacity: 0.7 }}>(3)</span>
                            </div>
                            <div style={{
                                backgroundColor: '#ffffff',
                                borderRadius: '8px',
                                padding: '10px',
                                border: '1px solid #cbdcf7',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                            }}>
                                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a', marginBottom: '6px' }}>
                                    Refactor JWT Roles
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '10px', color: '#305CDE', fontWeight: '700' }}>TASK-104</span>
                                    <span style={{ fontSize: '10px', background: '#eef3fc', color: '#305CDE', padding: '1px 6px', borderRadius: '10px', fontWeight: '700' }}>5 pts</span>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: In Progress */}
                        <div style={{
                            backgroundColor: '#eff6ff',
                            borderRadius: '10px',
                            padding: '10px',
                            border: '1px solid #cbdcf7'
                        }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#305CDE', marginBottom: '8px' }}>
                                IN PROGRESS <span style={{ opacity: 0.8 }}>(2)</span>
                            </div>
                            <div style={{
                                backgroundColor: '#ffffff',
                                borderRadius: '8px',
                                padding: '10px',
                                border: '1px solid #93c5fd',
                                boxShadow: '0 4px 10px rgba(48, 92, 222, 0.12)'
                            }}>
                                <div style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a', marginBottom: '6px' }}>
                                    Sprint Velocity Chart
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '10px', color: '#d97706', fontWeight: '700' }}>TASK-108</span>
                                    <span style={{ fontSize: '10px', background: '#fce7f3', color: '#db2777', padding: '1px 6px', borderRadius: '10px', fontWeight: '700' }}>8 pts</span>
                                </div>
                            </div>
                        </div>

                        {/* Column 3: Done */}
                        <div style={{
                            backgroundColor: '#f0fdf4',
                            borderRadius: '10px',
                            padding: '10px',
                            border: '1px solid #bbf7d0'
                        }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a', marginBottom: '8px' }}>
                                DONE <span style={{ opacity: 0.8 }}>(12)</span>
                            </div>
                            <div style={{
                                backgroundColor: '#ffffff',
                                borderRadius: '8px',
                                padding: '10px',
                                border: '1px solid #86efac'
                            }}>
                                <div style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textDecoration: 'line-through', marginBottom: '6px' }}>
                                    Kanban Drag & Drop
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: '700' }}>TASK-92</span>
                                    <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: '700' }}>✓</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Key Pillars */}
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontSize: '13px' }}>
                        <span style={{ color: '#93c5fd', fontSize: '16px' }}>✓</span>
                        <span>Interactive Sprints & Epics</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontSize: '13px' }}>
                        <span style={{ color: '#86efac', fontSize: '16px' }}>✓</span>
                        <span>Enterprise Role Permissions</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontSize: '13px' }}>
                        <span style={{ color: '#fde047', fontSize: '16px' }}>✓</span>
                        <span>Sprint Burndown & Velocity</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthHeroVisual;
