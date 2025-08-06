"use client"
import React from 'react';
import { BaseButton } from './shared';
import { BaseUIProps } from './shared/types';

interface ClearAllButtonProps extends BaseUIProps {
  onClick: () => void;
}

export const ClearAllButton: React.FC<ClearAllButtonProps> = ({
  onClick,
  className = '',
  effectsEnabled = true
}) => {
  return (
    <BaseButton
      variant="danger"
      onClick={onClick}
      title="Clear all champion selections"
      className={className}
      effectsEnabled={effectsEnabled}
    >
      Clear All
    </BaseButton>
  );
};
