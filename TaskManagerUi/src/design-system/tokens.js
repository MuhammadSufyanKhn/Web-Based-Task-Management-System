// NEXUS Task Management - Design System Tokens
// Single source of truth for all visual decisions.

export const colors = {
  bg: {
    base:        '#f8fafd',
    subtle:      '#edf4fe',
    surface:     '#ffffff',
    overlay:     '#ffffff',
    elevated:    '#e6f0fd',
    border:      '#cbdcf7',
    borderSubtle:'#e2edfb',
  },
  text: {
    primary:   '#0f172a',
    secondary: '#243c5a',
    tertiary:  '#506e8c',
    disabled:  '#94a9be',
    inverse:   '#ffffff',
  },
  accent: {
    default: '#305CDE',
    hover:   '#2448b8',
    active:  '#1b3593',
    subtle:  'rgba(48, 92, 222, 0.08)',
    border:  'rgba(48, 92, 222, 0.25)',
    muted:   '#4a72e8',
    strong:  '#305CDE',
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
    default: '#305CDE',
    subtle:  'rgba(48, 92, 222, 0.10)',
    border:  'rgba(48, 92, 222, 0.25)',
    text:    '#2448b8',
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
