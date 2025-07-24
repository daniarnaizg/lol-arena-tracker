import { useMemo } from 'react';

export const useGridColumns = (columns: number) => {
  return useMemo(() => {
    const safeColumns = Math.min(Math.max(columns, 1), 20);
    return `repeat(${safeColumns}, minmax(0, 1fr))`;
  }, [columns]);
};
