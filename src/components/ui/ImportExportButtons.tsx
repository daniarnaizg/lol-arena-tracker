"use client"
import React, { useState } from 'react';
import { Champion } from '@/services/ddragon';
import { championService } from '@/services/championService';
import { BaseButton } from './shared';
import { BaseUIProps } from './shared/types';
import { ClearAllButton } from './ClearAllButton';
import { 
  createExportData, 
  downloadJsonFile, 
  generateExportFilename,
  ImportModal
} from './import-export';

interface ImportExportButtonsProps extends BaseUIProps {
  champions: Champion[];
  onImport: (champions: Champion[]) => void;
  onClearAll: () => void;
}

export const ImportExportButtons: React.FC<ImportExportButtonsProps> = ({
  champions,
  onImport,
  onClearAll,
  effectsEnabled = true,
  className = ''
}) => {
  const [showImportModal, setShowImportModal] = useState(false);

  const handleExport = () => {
    const currentVersion = getCurrentGameVersion();
    const exportData = createExportData(champions, currentVersion);
    const filename = generateExportFilename();
    
    downloadJsonFile(exportData, filename);
  };

  const getCurrentGameVersion = (): string => {
    try {
      return championService.getCurrentVersion() || 'unknown';
    } catch {
      return 'unknown';
    }
  };

  const handleImport = (importedChampions: Champion[]) => {
    onImport(importedChampions);
    setShowImportModal(false);
  };

  return (
    <>
      <div className={`flex gap-3 ${className}`}>
        <BaseButton
          variant="primary"
          onClick={() => setShowImportModal(true)}
          title="Import champion progress"
          effectsEnabled={effectsEnabled}
        >
          Import data
        </BaseButton>

        <BaseButton
          variant="success"
          onClick={handleExport}
          title="Export champion progress"
          effectsEnabled={effectsEnabled}
        >
          Export data
        </BaseButton>
        
        <ClearAllButton 
          onClick={onClearAll} 
          effectsEnabled={effectsEnabled}
        />
      </div>

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />
    </>
  );
};
