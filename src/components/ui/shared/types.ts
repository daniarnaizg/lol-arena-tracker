/**
 * Shared types for UI components
 */

export interface BaseUIProps {
  className?: string;
  effectsEnabled?: boolean;
}

export interface ButtonStyleConfig {
  base: string;
  variants: Record<string, string>;
}

export interface MotionConfig {
  hover: { scale: number };
  tap: { scale: number };
}
