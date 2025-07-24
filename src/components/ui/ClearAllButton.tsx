"use client"
import React, { useRef, useEffect } from 'react';

interface ClearAllButtonProps {
  isClearing: boolean;
  progress: number;
  onStart: () => void;
  onStop: () => void;
  className?: string;
}

export const ClearAllButton: React.FC<ClearAllButtonProps> = ({
  isClearing,
  progress,
  onStart,
  onStop,
  className = ''
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);

  // Handle touch events for mobile
  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const handleContextMenu = (e: Event) => e.preventDefault();
    button.addEventListener('contextmenu', handleContextMenu);

    return () => {
      button.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return (
    <div
      ref={buttonRef}
      className={`
        relative overflow-hidden cursor-pointer select-none
        flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
        transition-all duration-200 group
        ${isClearing 
          ? 'bg-red-600 text-white border-red-700' 
          : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
        }
        border-2 whitespace-nowrap
        ${className}
      `}
      onMouseDown={onStart}
      onMouseUp={onStop}
      onMouseLeave={onStop}
      onTouchStart={onStart}
      onTouchEnd={onStop}
      title="Hold to clear all selections"
    >
      <span>🗑️</span>
      <span>{isClearing ? 'Clearing...' : 'Clear All'}</span>
      
      {/* Progress bar */}
      <div 
        className={`
          absolute bottom-0 left-0 h-1 transition-all duration-100 rounded-b-md
          ${isClearing ? 'bg-white/80' : 'bg-red-600'}
        `}
        style={{
          width: `${Math.min(Math.max(progress, 0), 100)}%`
        }}
      />
      
      {/* Tooltip */}
      <div className="
        absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2
        bg-gray-700 text-white text-xs px-2 py-1 rounded whitespace-nowrap
        opacity-0 group-hover:opacity-100 transition-opacity duration-300
        pointer-events-none z-50
      ">
        Hold to clear all selections
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-700" />
      </div>
    </div>
  );
};
