"use client"
import React from 'react';

interface ClearAllButtonProps {
  onClick: () => void;
  className?: string;
}

export const ClearAllButton: React.FC<ClearAllButtonProps> = ({
  onClick,
  className = ''
}) => {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
        transition-all duration-200 group
        bg-red-200 text-gray-800 hover:bg-red-300
        border-2 whitespace-nowrap
        focus:outline-none focus:ring-2 focus:ring-red-800
        ${className}
      `}
      title="Clear all selections"
    >
      <span>❌</span>
      <span>Clear All</span>
      
      {/* Tooltip */}
      <div className="
        absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
        bg-gray-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap
        opacity-0 group-hover:opacity-100 transition-opacity duration-300
        pointer-events-none z-50
      ">
        Clear all champion selections
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-700" />
      </div>
    </button>
  );
};
