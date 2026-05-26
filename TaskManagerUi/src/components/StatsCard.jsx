import React from "react";
import PropTypes from "prop-types";

const StatsCard = ({ title, count, className }) => {
    return (
        <div className={`stat-card ${className}`}>
            <h3>{title}</h3>
            <p className="count">{count || 0}</p>
        </div>
    );
};

StatsCard.propTypes = {
    title: PropTypes.string.isRequired,
    count: PropTypes.number,
    className: PropTypes.string.isRequired
};

export default StatsCard;