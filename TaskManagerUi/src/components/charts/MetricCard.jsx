import React from 'react';
import PropTypes from 'prop-types';

const MetricCard = ({
    title,
    value,
    subtitle,
    icon,
    color = '#0052cc',
    bgColor = '#f4f5f7',
    progress = null
}) => {
    return (
        <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            border: '1px solid #ebecf0',
            padding: '18px 20px',
            boxShadow: '0 1px 3px rgba(9, 30, 66, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '4px',
                height: '100%',
                backgroundColor: color
            }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#5e6c84', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    {title}
                </span>
                {icon && (
                    <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        backgroundColor: bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px'
                    }}>
                        {icon}
                    </div>
                )}
            </div>

            <div style={{ fontSize: '28px', fontWeight: '800', color: '#172b4d', lineHeight: '1.2' }}>
                {value}
            </div>

            {subtitle && (
                <div style={{ fontSize: '12px', color: '#6b778c', marginTop: '6px' }}>
                    {subtitle}
                </div>
            )}

            {progress !== null && (
                <div style={{ marginTop: '10px' }}>
                    <div style={{
                        height: '6px',
                        backgroundColor: '#ebecf0',
                        borderRadius: '3px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${Math.min(100, Math.max(0, progress))}%`,
                            height: '100%',
                            backgroundColor: color,
                            borderRadius: '3px',
                            transition: 'width 0.4s ease'
                        }} />
                    </div>
                </div>
            )}
        </div>
    );
};

MetricCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    subtitle: PropTypes.string,
    icon: PropTypes.node,
    color: PropTypes.string,
    bgColor: PropTypes.string,
    progress: PropTypes.number
};

export default MetricCard;
