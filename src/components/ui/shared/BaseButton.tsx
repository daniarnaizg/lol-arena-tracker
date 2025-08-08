/**
 * Reusable base button component with consistent styling
 */

"use client"
import React from 'react';
import { BaseUIProps } from './types';
import { MotionWrapper } from './MotionWrapper';
import { createButtonClass, combineClasses } from './utils';
import { MOTION_CONFIGS } from './constants';

interface BaseButtonProps extends BaseUIProps {
  variant?: 'primary' | 'secondary' | 'success' | 'fancy' | 'danger' | 'warning' | 'disabled';
  size?: 'sm' | 'md' | 'lg';
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
  ariaPressed?: boolean;
  motionConfig?: keyof typeof MOTION_CONFIGS;
}

const SIZE_CLASSES = {
  sm: 'px-3 py-2 md:py-1.5 text-xs',
  md: 'px-4 py-2.5 md:py-2 text-sm',
  lg: 'px-6 py-3.5 md:py-3 text-base'
} as const;

export const BaseButton: React.FC<BaseButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  onClick,
  children,
  title,
  disabled = false,
  type = 'button',
  ariaLabel,
  ariaPressed,
  className = '',
  effectsEnabled = true,
  motionConfig = 'button'
}) => {
  const buttonClasses = combineClasses(
    createButtonClass(disabled ? 'disabled' : variant),
    SIZE_CLASSES[size],
    className
  );

  const button = (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      className={buttonClasses}
      title={title}
      disabled={disabled}
      aria-label={ariaLabel}
      {...(ariaPressed !== undefined && { 'aria-pressed': ariaPressed })}
    >
      {children}
    </button>
  );

  return (
    <MotionWrapper
      effectsEnabled={effectsEnabled}
      config={MOTION_CONFIGS[motionConfig]}
      disabled={disabled}
    >
      {button}
    </MotionWrapper>
  );
};
