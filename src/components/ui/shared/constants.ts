/**
 * Shared constants and configurations for UI components
 */

import { ButtonStyleConfig, MotionConfig } from './types';

// Base button configuration
export const BUTTON_STYLES: ButtonStyleConfig = {
  base: 'px-4 py-2 rounded-lg font-medium transition-all duration-200 border shadow-sm hover:shadow-md',
  variants: {
    primary: 'text-white border-blue-700 hover:bg-blue-700',
    secondary: 'bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600',
    success: 'text-white border-green-700 hover:bg-green-700',
    fancy: 'text-white border-pink-700/80 hover:bg-pink-700/80',
    danger: 'text-white border-red-700 hover:bg-red-700',
    warning: 'text-white border-yellow-700 hover:bg-yellow-700',
    disabled: 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300',
  }
};

// Motion animation configurations
export const MOTION_CONFIGS: Record<string, MotionConfig> = {
  button: {
    hover: { scale: 1.02 },
    tap: { scale: 0.98 }
  },
  filter: {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  },
  gentle: {
    hover: { scale: 1.01 },
    tap: { scale: 0.99 }
  }
};

// Common class combinations
export const LAYOUT_CLASSES = {
  flexCenter: 'flex items-center justify-center',
  flexBetween: 'flex items-center justify-between',
  flexCol: 'flex flex-col',
  flexRow: 'flex flex-row',
  gap: {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  }
} as const;
