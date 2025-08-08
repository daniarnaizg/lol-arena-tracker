"use client"
import React, { useMemo } from 'react';
import { BaseUIProps } from './shared/types';
import { combineClasses } from './shared/utils';

interface ColumnSliderProps extends BaseUIProps {
  columns: number;
  minColumns: number;
  maxColumns: number;
  onColumnsChange: (columns: number) => void;
}

export const ColumnSlider: React.FC<ColumnSliderProps> = ({
  columns,
  minColumns,
  maxColumns,
  onColumnsChange,
  className = ''
}) => {
  // On small screens, cap the max at 3 for better readability
  const effectiveMax = useMemo(() => {
    if (typeof window === 'undefined') return maxColumns;
    const isSmallPortrait = window.matchMedia && window.matchMedia('(max-width: 640px) and (orientation: portrait)').matches;
    return isSmallPortrait ? Math.min(3, maxColumns) : maxColumns;
  }, [maxColumns]);

  const effectiveMin = useMemo(() => {
    if (typeof window === 'undefined') return minColumns;
    const isSmallPortrait = window.matchMedia && window.matchMedia('(max-width: 640px) and (orientation: portrait)').matches;
    return isSmallPortrait ? Math.min(minColumns, 1) : minColumns;
  }, [minColumns]);
  const containerClasses = combineClasses(
    'flex items-center gap-3 md:gap-4 w-full max-w-sm md:max-w-md',
    className
  );

  return (
    <div className={containerClasses}>
      <label 
        htmlFor="columns-slider" 
        className="text-sm md:text-base font-medium whitespace-nowrap text-gray-100"
      >
        Columns:
      </label>
      <input
        id="columns-slider"
        type="range"
        min={effectiveMin}
        max={effectiveMax}
        step={1}
        value={columns}
        onChange={e => onColumnsChange(Number(e.target.value))}
        className="w-full accent-slate-500 cursor-pointer touch-pan-x"
      />
      <span className="text-xs md:text-sm w-8 md:w-10 text-center text-gray-100">
        {columns}
      </span>
    </div>
  );
};
