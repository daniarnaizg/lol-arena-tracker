/**
 * Types and utilities for import/export functionality
 */

import { Champion } from '@/services/ddragon';

export interface ExportData {
  version: string;
  exportDate: string;
  champions: Champion[];
  metadata: {
    totalChampions: number;
    appVersion: string;
  };
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  data?: Champion[];
  warnings?: string[];
}

export const APP_VERSION = '1.0.0';

/**
 * Creates export data structure
 */
export const createExportData = (champions: Champion[], version: string): ExportData => ({
  version,
  exportDate: new Date().toISOString(),
  champions: champions.map(champ => ({
    id: champ.id,
    name: champ.name,
    imageKey: champ.imageKey,
    checklist: { ...champ.checklist }
  })),
  metadata: {
    totalChampions: champions.length,
    appVersion: APP_VERSION
  }
});

/**
 * Downloads JSON data as a file
 */
export const downloadJsonFile = (data: ExportData, filename: string): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generates filename for export
 */
export const generateExportFilename = (): string => {
  const date = new Date().toISOString().split('T')[0];
  return `lol-arena-progress-${date}.json`;
};
