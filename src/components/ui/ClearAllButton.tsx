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
        px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2
        text-white border border-red-700 hover:bg-red-700
        ${className}
      `}
      title="Clear all champion selections"
    >
      Clear All
    </button>
  );
};
