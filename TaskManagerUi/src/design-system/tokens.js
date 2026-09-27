// NEXUS Task Management - Design System Tokens
// Single source of truth for all visual decisions.

export const colors = {
  bg: {
    base:        '#f8fafc',
    subtle:      '#f1f5f9',
    surface:     '#ffffff',
    overlay:     '#ffffff',
    elevated:    '#f8fafc',
    border:      '#cbd5e1',
    borderSubtle:'#e2e8f0',
    sidebar:     '#0a192f',
    sidebarHover:'rgba(255, 255, 255, 0.08)',
    sidebarActive:'#1e40af',
  },
  text: {
    primary:   '#0f172a',
    secondary: '#334155',
    tertiary:  '#64748b',
    disabled:  '#94a3b8',
    inverse:   '#ffffff',
  },
  accent: {
    default: '#1e3a8a',
    hover:   '#172554',
    active:  '#1e40af',
    subtle:  'rgba(30, 58, 138, 0.08)',
    border:  'rgba(30, 58, 138, 0.25)',
    muted:   '#2563eb',
    strong:  '#1e3a8a',
  },
  navy: {
    950: '#070f1e',
    900: '#0a192f',
    800: '#0f274a',
    700: '#1e3a8a',
    600: '#1d4ed8',
    500: '#2563eb',
    100: '#dbeafe',
    50:  '#eff6ff',
  },
  success: {
    default: '#16a34a',
    subtle:  'rgba(22, 163, 74, 0.10)',
    border:  'rgba(22, 163, 74, 0.25)',
    text:    '#15803d',
  },
  warning: {
    default: '#d97706',
    subtle:  'rgba(217, 119, 6, 0.10)',
    border:  'rgba(217, 119, 6, 0.25)',
    text:    '#b45309',
  },
  danger: {
    default: '#dc2626',
    subtle:  'rgba(220, 38, 38, 0.10)',
    border:  'rgba(220, 38, 38, 0.25)',
    text:    '#b91c1c',
  },
  info: {
    default: '#1e3a8a',
    subtle:  'rgba(30, 58, 138, 0.10)',
    border:  'rgba(30, 58, 138, 0.25)',
    text:    '#1e3a8a',
  },
};

export const typography = {
  family: {
    sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", Consolas, monospace',
  },
  size: {
    xs:   '11px',
    sm:   '12px',
    base: '13px',
    md:   '14px',
    lg:   '15px',
    xl:   '17px',
    '2xl':'20px',
    '3xl':'24px',
    '4xl':'30px',
  },
  weight: {
    normal:   '400',
    medium:   '500',
    semibold: '600',
    bold:     '700',
  },
};

export const radius = {
  sm:   '4px',
  md:   '6px',
  lg:   '8px',
  xl:   '10px',
  '2xl':'12px',
  full: '9999px',
};

export const shadows = {
  sm:   '0 1px 2px rgba(0, 0, 0, 0.3)',
  md:   '0 2px 8px rgba(0, 0, 0, 0.4)',
  lg:   '0 8px 24px rgba(0, 0, 0, 0.5)',
  xl:   '0 16px 40px rgba(0, 0, 0, 0.6)',
  card: '0 1px 3px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
  modal:'0 24px 64px rgba(0, 0, 0, 0.7)',
  focus:'0 0 0 3px rgba(99, 102, 241, 0.25)',
};

export const transitions = {
  fast:   'all 0.1s ease',
  normal: 'all 0.2s ease',
  slow:   'all 0.3s ease',
};

export const layout = {
  navWidth:    '220px',
  navbarHeight:'56px',
  maxContent:  '1440px',
  pageGutter:  '24px',
};

export default { colors, typography, radius, shadows, transitions, layout };
