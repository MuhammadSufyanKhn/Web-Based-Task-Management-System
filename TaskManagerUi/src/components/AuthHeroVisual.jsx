import React from 'react';

const AuthHeroVisual = ({ title = "Welcome to Task Management System", subtitle = "Empower your engineering teams with Jira-inspired workflows, real-time Kanban boards, sprint tracking, and automated velocity analytics." }) => {
    return (
        <div style={{
            flex: '1 1 50%',
            background: 'linear-gradient(145deg, #090d16 0%, #111827 50%, #1e1b4b 100%)',
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
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
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
                background: 'radial-gradient(circle, rgba(147, 51, 234, 0.15) 0%, transparent 70%)',
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
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    color: '#60a5fa',
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
                    color: '#94a3b8',
                    lineHeight: '1.6',
                    margin: '0 0 32px 0'
                }}>
                    {subtitle}
                </p>

                {/* SaaS Visual Card Preview */}
                <div style={{
                    background: 'rgba(15, 23, 42, 0.75)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    padding: '20px',
                    marginBottom: '28px'
                }}>
                    {/* Mock App Window Header */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingBottom: '14px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        marginBottom: '16px'
                    }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                        </div>
                        <div style={{
                            fontSize: '11px',
                            color: '#64748b',
                            fontWeight: '600',
                            letterSpacing: '0.4px'
                        }}>
                            SPRINT 4 • KANBAN BOARD
                        </div>
                        <div style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#34d399',
                            fontWeight: '700'
                        }}>
                            Active
                        </div>
                    </div>

                    {/* Columns Preview */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                        {/* Column 1: To Do */}
                        <div style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '10px',
                            padding: '10px',
                            border: '1px solid rgba(255, 255, 255, 0.06)'
                        }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8', marginBottom: '8px' }}>
                                TO DO <span style={{ opacity: 0.6 }}>(3)</span>
                            </div>
                            <div style={{
                                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                                borderRadius: '8px',
                                padding: '10px',
                                border: '1px solid rgba(255, 255, 255, 0.08)'
                            }}>
                                <div style={{ fontSize: '12px', fontWeight: '600', color: '#e2e8f0', marginBottom: '6px' }}>
                                    Refactor JWT Roles
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '10px', color: '#60a5fa', fontWeight: '700' }}>TASK-104</span>
                                    <span style={{ fontSize: '10px', background: '#3b82f6', color: '#fff', padding: '1px 6px', borderRadius: '10px' }}>5 pts</span>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: In Progress */}
                        <div style={{
                            backgroundColor: 'rgba(59, 130, 246, 0.05)',
                            borderRadius: '10px',
                            padding: '10px',
                            border: '1px solid rgba(59, 130, 246, 0.2)'
                        }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#60a5fa', marginBottom: '8px' }}>
                                IN PROGRESS <span style={{ opacity: 0.8 }}>(2)</span>
                            </div>
                            <div style={{
                                backgroundColor: 'rgba(30, 41, 59, 0.95)',
                                borderRadius: '8px',
                                padding: '10px',
                                border: '1px solid rgba(59, 130, 246, 0.4)',
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.2)'
                            }}>
                                <div style={{ fontSize: '12px', fontWeight: '600', color: '#ffffff', marginBottom: '6px' }}>
                                    Sprint Velocity Chart
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: '700' }}>TASK-108</span>
                                    <span style={{ fontSize: '10px', background: '#ec4899', color: '#fff', padding: '1px 6px', borderRadius: '10px' }}>8 pts</span>
                                </div>
                            </div>
                        </div>

                        {/* Column 3: Done */}
                        <div style={{
                            backgroundColor: 'rgba(16, 185, 129, 0.05)',
                            borderRadius: '10px',
                            padding: '10px',
                            border: '1px solid rgba(16, 185, 129, 0.2)'
                        }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: '#34d399', marginBottom: '8px' }}>
                                DONE <span style={{ opacity: 0.8 }}>(12)</span>
                            </div>
                            <div style={{
                                backgroundColor: 'rgba(30, 41, 59, 0.8)',
                                borderRadius: '8px',
                                padding: '10px',
                                border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}>
                                <div style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', textDecoration: 'line-through', marginBottom: '6px' }}>
                                    Kanban Drag & Drop
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '10px', color: '#10b981', fontWeight: '700' }}>TASK-92</span>
                                    <span style={{ fontSize: '10px', color: '#34d399' }}>✓</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Key Pillars */}
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '13px' }}>
                        <span style={{ color: '#3b82f6', fontSize: '16px' }}>✓</span>
                        <span>Interactive Sprints & Epics</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '13px' }}>
                        <span style={{ color: '#10b981', fontSize: '16px' }}>✓</span>
                        <span>Enterprise Role Permissions</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '13px' }}>
                        <span style={{ color: '#f59e0b', fontSize: '16px' }}>✓</span>
                        <span>Sprint Burndown & Velocity</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthHeroVisual;
