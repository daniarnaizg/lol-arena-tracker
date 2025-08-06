/**
 * Reusable wrapper component for motion effects
 */

"use client"
import React from 'react';
import { motion } from 'framer-motion';
import { BaseUIProps, MotionConfig } from './types';

interface MotionWrapperProps extends BaseUIProps {
  children: React.ReactNode;
  config?: MotionConfig;
  disabled?: boolean;
}

export const MotionWrapper: React.FC<MotionWrapperProps> = ({
  children,
  className = '',
  effectsEnabled = true,
  config = { hover: { scale: 1.02 }, tap: { scale: 0.98 } },
  disabled = false
}) => {
  // If effects are disabled or component is disabled, render without motion
  if (!effectsEnabled || disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      whileHover={config.hover}
      whileTap={config.tap}
    >
      {children}
    </motion.div>
  );
};
