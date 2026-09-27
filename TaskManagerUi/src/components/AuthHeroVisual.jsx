import React from 'react';

const AuthHeroVisual = ({ isRegister = false }) => {
    return (
        <div style={{
            width: '100%',
            height: '100%',
            background: isRegister
                ? 'linear-gradient(145deg, #09132b 0%, #172554 35%, #1e40af 70%, #3b82f6 100%)'
                : 'linear-gradient(145deg, #071224 0%, #0a192f 35%, #1e3a8a 70%, #2563eb 100%)',
            padding: '48px 48px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxSizing: 'border-box',
            transition: 'background 0.6s ease'
        }}>
            {/* Ambient Background Glows */}
            <div style={{
                position: 'absolute',
                top: '-10%',
                left: '-10%',
                width: '420px',
                height: '420px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.22) 0%, transparent 70%)',
                filter: 'blur(40px)',
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-10%',
                right: '-10%',
                width: '440px',
                height: '440px',
                borderRadius: '50%',
                background: isRegister
                    ? 'radial-gradient(circle, rgba(96, 165, 250, 0.3) 0%, transparent 70%)'
                    : 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, transparent 70%)',
                filter: 'blur(50px)',
                pointerEvents: 'none'
            }} />

            <div style={{ maxWidth: '540px', width: '100%', zIndex: 1, transition: 'all 0.4s ease' }}>
                {/* ── MODE 1: LOGIN VISUAL ────────────────────────── */}
                {!isRegister ? (
                    <div style={{ animation: 'authFadeIn 0.45s ease forwards' }}>
                        {/* Brand Pill */}
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 14px',
                            borderRadius: '20px',
                            backgroundColor: 'rgba(255, 255, 255, 0.16)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
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
                            margin: '0 0 14px 0',
                            letterSpacing: '-0.5px'
                        }}>
                            Welcome to Task Management System
                        </h1>

                        {/* Subtitle */}
                        <p style={{
                            fontSize: '15px',
                            color: '#e2e8f0',
                            lineHeight: '1.6',
                            margin: '0 0 28px 0'
                        }}>
                            Streamline sprints, automate task workflows, and track team velocity with enterprise-grade agility.
                        </p>

                        {/* Mock App Window Preview: Kanban Board */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.98)',
                            borderRadius: '16px',
                            border: '1px solid #bfdbfe',
                            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
                            padding: '20px',
                            marginBottom: '26px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingBottom: '12px',
                                borderBottom: '1px solid #e2e8f0',
                                marginBottom: '14px'
                            }}>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                                </div>
                                <div style={{ fontSize: '11px', color: '#1e3a8a', fontWeight: '800', letterSpacing: '0.4px' }}>
                                    SPRINT 4 • KANBAN BOARD
                                </div>
                                <div style={{
                                    fontSize: '10px',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    background: '#dcfce7',
                                    color: '#16a34a',
                                    fontWeight: '700'
                                }}>
                                    Active
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                {/* Col 1 */}
                                <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '10px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569', marginBottom: '8px' }}>
                                        TO DO (3)
                                    </div>
                                    <div style={{ backgroundColor: '#ffffff', borderRadius: '6px', padding: '10px', border: '1px solid #cbd5e1' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a', marginBottom: '6px' }}>
                                            Refactor JWT Roles
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '10px', color: '#1e3a8a', fontWeight: '700' }}>TASK-104</span>
                                            <span style={{ fontSize: '10px', background: '#eff6ff', color: '#1e3a8a', padding: '1px 6px', borderRadius: '10px', fontWeight: '700' }}>5 pts</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Col 2 */}
                                <div style={{ backgroundColor: '#eff6ff', borderRadius: '8px', padding: '10px', border: '1px solid #bfdbfe' }}>
                                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#1e3a8a', marginBottom: '8px' }}>
                                        IN PROGRESS (2)
                                    </div>
                                    <div style={{ backgroundColor: '#ffffff', borderRadius: '6px', padding: '10px', border: '1px solid #93c5fd', boxShadow: '0 2px 6px rgba(30, 58, 138, 0.1)' }}>
                                        <div style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a', marginBottom: '6px' }}>
                                            Sprint Velocity Chart
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '10px', color: '#d97706', fontWeight: '700' }}>TASK-108</span>
                                            <span style={{ fontSize: '10px', background: '#fef3c7', color: '#b45309', padding: '1px 6px', borderRadius: '10px', fontWeight: '700' }}>8 pts</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Col 3 */}
                                <div style={{ backgroundColor: '#f0fdf4', borderRadius: '8px', padding: '10px', border: '1px solid #bbf7d0' }}>
                                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#16a34a', marginBottom: '8px' }}>
                                        DONE (12)
                                    </div>
                                    <div style={{ backgroundColor: '#ffffff', borderRadius: '6px', padding: '10px', border: '1px solid #86efac' }}>
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
                ) : (
                    /* ── MODE 2: REGISTER VISUAL (Completely Different Visual!) ── */
                    <div style={{ animation: 'authFadeIn 0.45s ease forwards' }}>
                        {/* Brand Pill */}
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 14px',
                            borderRadius: '20px',
                            backgroundColor: 'rgba(255, 255, 255, 0.16)',
                            border: '1px solid rgba(255, 255, 255, 0.25)',
                            color: '#ffffff',
                            fontSize: '12px',
                            fontWeight: '700',
                            letterSpacing: '0.5px',
                            marginBottom: '20px',
                            textTransform: 'uppercase'
                        }}>
                            <span>🚀 Smart Team Collaboration</span>
                        </div>

                        {/* Main Heading */}
                        <h1 style={{
                            fontSize: '32px',
                            fontWeight: '800',
                            color: '#ffffff',
                            lineHeight: '1.25',
                            margin: '0 0 14px 0',
                            letterSpacing: '-0.5px'
                        }}>
                            Collaborate at the Speed of Light
                        </h1>

                        {/* Subtitle */}
                        <p style={{
                            fontSize: '15px',
                            color: '#e2e8f0',
                            lineHeight: '1.6',
                            margin: '0 0 28px 0'
                        }}>
                            Join thousands of engineering teams utilizing modern agile sprints, real-time board sync, and deep analytical reports.
                        </p>

                        {/* Completely Different Mock Card: Live Collaboration & Activity Feed */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.98)',
                            borderRadius: '16px',
                            border: '1px solid #bfdbfe',
                            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)',
                            padding: '20px',
                            marginBottom: '26px'
                        }}>
                            {/* Window Header with Team Avatars */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingBottom: '12px',
                                borderBottom: '1px solid #e2e8f0',
                                marginBottom: '14px'
                            }}>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {['SK', 'JD', 'AM', 'SL'].map((init, i) => (
                                        <div key={i} style={{
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            backgroundColor: ['#1e40af', '#2563eb', '#10b981', '#d97706'][i],
                                            color: '#ffffff',
                                            fontSize: '10px',
                                            fontWeight: '700',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            border: '2px solid #ffffff'
                                        }}>
                                            {init}
                                        </div>
                                    ))}
                                    <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '700', marginLeft: '4px' }}>
                                        ● 8 Online
                                    </span>
                                </div>
                            </div>

                            {/* Live Activity Items */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 12px',
                                    backgroundColor: '#f8fafc',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '13px' }}>✅</span>
                                        <div>
                                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                                                TASK-2156 UI & Gantt Overhaul
                                            </div>
                                            <div style={{ fontSize: '10px', color: '#64748b' }}>Completed by Sufyan · Just now</div>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#15803d', backgroundColor: '#dcfce7', padding: '2px 8px', borderRadius: '10px' }}>
                                        +5 pts
                                    </span>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 12px',
                                    backgroundColor: '#f8fafc',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '13px' }}>⚡</span>
                                        <div>
                                            <div style={{ fontSize: '12px', fontWeight: '700', color: '#0f172a' }}>
                                                Jira REST API v3 Sync
                                            </div>
                                            <div style={{ fontSize: '10px', color: '#64748b' }}>Connected & Auto-Synced</div>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#1e40af', backgroundColor: '#dbeafe', padding: '2px 8px', borderRadius: '10px' }}>
                                        Synced
                                    </span>
                                </div>
                            </div>

                            {/* Velocity & Progress Progress Meter */}
                            <div style={{
                                padding: '10px 12px',
                                backgroundColor: '#eff6ff',
                                borderRadius: '8px',
                                border: '1px solid #bfdbfe'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '700', color: '#1e3a8a', marginBottom: '6px' }}>
                                    <span>Sprint Milestone Completion</span>
                                    <span>88% On Track</span>
                                </div>
                                <div style={{ width: '100%', height: '8px', backgroundColor: '#dbeafe', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: '88%', height: '100%', backgroundColor: '#10b981', borderRadius: '4px' }} />
                                </div>
                            </div>
                        </div>

                        {/* Key Pillars for Register */}
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontSize: '13px' }}>
                                <span style={{ color: '#93c5fd', fontSize: '16px' }}>✓</span>
                                <span>Real-Time Team Activity Stream</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontSize: '13px' }}>
                                <span style={{ color: '#86efac', fontSize: '16px' }}>✓</span>
                                <span>Dynamic Jira Cloud REST Sync</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontSize: '13px' }}>
                                <span style={{ color: '#fde047', fontSize: '16px' }}>✓</span>
                                <span>Interactive Gantt & Timeline</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthHeroVisual;
