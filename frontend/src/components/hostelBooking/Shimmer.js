// Shimmer.js
import React from 'react';

const Shimmer = ({ width, height, className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-gray-700 ${className}`}
      style={{ width, height }}
    ></div>
  );
};

export default Shimmer;
