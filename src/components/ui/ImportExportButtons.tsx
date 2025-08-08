"use client"
import React, { useState } from 'react';
import { Champion } from '@/services/ddragon';
import { championService } from '@/services/championService';
import { BaseButton } from './shared';
import { BaseUIProps } from './shared/types';
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
      <div className={`flex pr-2 items-center gap-2 whitespace-nowrap overflow-x-auto ${className}`}>
        <BaseButton
          variant="primary"
          size="sm"
          onClick={() => setShowImportModal(true)}
          title="Import champion progress"
          effectsEnabled={effectsEnabled}
          className="md:px-4 md:py-2 md:text-sm"
        >
          <span className="sm:hidden">Import</span>
          <span className="hidden sm:inline">Import data</span>
        </BaseButton>

        <BaseButton
          variant="success"
          size="sm"
          onClick={handleExport}
          title="Export champion progress"
          effectsEnabled={effectsEnabled}
          className="md:px-4 md:py-2 md:text-sm"
        >
          <span className="sm:hidden">Export</span>
          <span className="hidden sm:inline">Export data</span>
        </BaseButton>
        
        <BaseButton
          variant="danger"
          size="sm"
          onClick={onClearAll}
          title="Clear all champion selections"
          effectsEnabled={effectsEnabled}
          className="md:px-4 md:py-2 md:text-sm"
        >
          <span className="sm:hidden">Clear</span>
          <span className="hidden sm:inline">Clear all</span>
        </BaseButton>
      </div>

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
      />
    </>
  );
};
