import React from 'react';

const ForceReleaseButton = ({ onForceRelease, loading }) => {
    return (
        <button
            onClick={onForceRelease}
            disabled={loading}
            className="force-release-btn"
        >
            {loading ? "Liberando..." : "Forzar Liberación"}
        </button>
    );
};

export default ForceReleaseButton;
