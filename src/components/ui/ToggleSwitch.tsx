"use client"
import React from 'react';

interface ToggleSwitchProps {
  enabled: boolean;
  onToggle: () => void;
  enabledIcon?: string;
  disabledIcon?: string;
  tooltip?: string;
  className?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  enabled,
  onToggle,
  enabledIcon = '✨',
  disabledIcon = '🚫',
  tooltip,
  className = ''
}) => {
  return (
    <div 
      className={`
        relative w-14 h-8 rounded-full transition-all duration-300 cursor-pointer 
        border-2 group
        ${enabled 
          ? 'bg-purple-500 border-purple-600' 
          : 'bg-slate-300 border-slate-200'
        }
        ${className}
      `}
      onClick={onToggle}
      title={tooltip}
    >
      <div 
        className={`
          absolute top-0.5 w-6 h-6 bg-white rounded-full transition-all duration-300
          flex items-center justify-center text-xs shadow-md
          ${enabled ? 'left-7' : 'left-0.5'}
        `}
      >
        {enabled ? enabledIcon : disabledIcon}
      </div>
      
      {/* Tooltip */}
      {tooltip && (
        <div className="
          absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
          bg-gray-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap
          opacity-0 group-hover:opacity-100 transition-opacity duration-300
          pointer-events-none z-50
        ">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-700" />
        </div>
      )}
    </div>
  );
};
