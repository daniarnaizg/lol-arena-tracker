"use client"
import React from 'react';

interface RefreshButtonProps {
  isRefreshing: boolean;
  onRefresh: () => void;
  tooltip?: string;
  className?: string;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  isRefreshing,
  onRefresh,
  tooltip = "Refresh champion data from DDragon API",
  className = ''
}) => {
  return (
    <button
      onClick={onRefresh}
      disabled={isRefreshing}
      className={`
        relative overflow-hidden bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300
        text-white font-medium py-2 px-4 rounded-lg
        transition-all duration-200 ease-in-out
        flex items-center gap-2 min-w-[120px] justify-center
        disabled:cursor-not-wait
        ${className}
      `}
      title={tooltip}
    >
      {/* Refresh Icon */}
      <svg
        className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      
      <span className="text-sm">
        {isRefreshing ? 'Updating...' : 'Refresh'}
      </span>
    </button>
  );
};
