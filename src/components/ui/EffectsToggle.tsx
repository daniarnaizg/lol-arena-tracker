"use client"
import React from 'react';
import { motion } from 'framer-motion';

interface EffectsToggleProps {
  enabled: boolean;
  onToggle: () => void;
  effectsEnabled?: boolean;
  className?: string;
}

export const EffectsToggle: React.FC<EffectsToggleProps> = ({
  enabled,
  onToggle,
  effectsEnabled = true,
  className = ''
}) => {
  const renderButton = () => {
    const buttonStyles = enabled 
      ? "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600 shadow-sm hover:shadow-md whitespace-nowrap"
      : "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border bg-pink-600/30 text-white border-pink-500/50 hover:bg-pink-700 shadow-sm hover:shadow-md whitespace-nowrap";

    return (
      <button
        className={buttonStyles}
        onClick={onToggle}
        type="button"
        title={enabled ? "Disable animations and effects" : "Enable animations and effects"}
      >
        <span>{enabled ? 'Disable effects' : 'Enable effects'}</span>
      </button>
    );
  };

  if (!effectsEnabled) {
    return (
      <div className={className}>
        {renderButton()}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {renderButton()}
    </motion.div>
  );
};
