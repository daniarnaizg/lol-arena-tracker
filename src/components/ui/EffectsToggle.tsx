"use client"
import React from 'react';
import { BaseButton } from './shared';
import { BaseUIProps } from './shared/types';

interface EffectsToggleProps extends BaseUIProps {
  enabled: boolean;
  onToggle: () => void;
}

export const EffectsToggle: React.FC<EffectsToggleProps> = ({
  enabled,
  onToggle,
  effectsEnabled = true,
  className = ''
}) => {
  const variant = enabled ? 'secondary' : 'fancy';
  const buttonText = enabled ? 'Disable effects' : 'Enable effects';
  const title = enabled ? "Disable animations and effects" : "Enable animations and effects";

  return (
    <BaseButton
      variant={variant}
      onClick={onToggle}
      title={title}
      size="sm"
      className={`whitespace-nowrap ${className}`}
      effectsEnabled={effectsEnabled}
    >
      <span className="hidden sm:inline">{buttonText}</span>
      <span className="sm:hidden">{enabled ? 'Effects: On' : 'Effects: Off'}</span>
    </BaseButton>
  );
};
