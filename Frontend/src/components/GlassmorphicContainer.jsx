import React from 'react';
import PropTypes from 'prop-types';

const GlassmorphicContainer = ({ children, className = '' }) => {
  return (
    <div
      className={`backdrop-blur-xl bg-white/10 dark:bg-black/20 border border-white/20 rounded-2xl shadow-xl p-6 ${className}`}
    >
      {children}
    </div>
  );
};

GlassmorphicContainer.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default GlassmorphicContainer;
