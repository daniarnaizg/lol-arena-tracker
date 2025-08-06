/**
 * Shared utility functions for UI components
 */

import { BUTTON_STYLES } from './constants';

/**
 * Combines base and variant button styles
 */
export const createButtonClass = (
  variant: keyof typeof BUTTON_STYLES.variants,
  additionalClasses = ''
): string => {
  const baseClasses = BUTTON_STYLES.base;
  const variantClasses = BUTTON_STYLES.variants[variant];
  
  return [baseClasses, variantClasses, additionalClasses]
    .filter(Boolean)
    .join(' ');
};

/**
 * Safely combines CSS classes, filtering out empty values
 */
export const combineClasses = (...classes: (string | undefined | null | false)[]): string => {
  return classes
    .filter(Boolean)
    .join(' ');
};
