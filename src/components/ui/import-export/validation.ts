/**
 * Validation logic for import data
 */

import { ValidationResult } from './types';

/**
 * Validates imported JSON content
 */
export const validateImportData = (jsonContent: string): ValidationResult => {
  try {
    const data = JSON.parse(jsonContent);
    
    // Check basic structure
    if (!data || typeof data !== 'object') {
      return { isValid: false, error: 'Invalid file format: Expected JSON object' };
    }

    // Check if it's our export format
    if (data.champions && Array.isArray(data.champions)) {
      const champions = data.champions;
      const warnings: string[] = [];
      
      // Validate each champion
      const validationError = validateChampionsArray(champions);
      if (validationError) {
        return validationError;
      }
      
      // Check version compatibility
      if (data.version && typeof data.version === 'string') {
        warnings.push(`Imported from LoL patch: ${data.version}`);
      }
      
      return { 
        isValid: true, 
        data: champions,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    }
    
    // Check if it's a direct champion array (legacy format)
    if (Array.isArray(data)) {
      const validationError = validateChampionsArray(data);
      if (validationError) {
        return validationError;
      }
      
      return { 
        isValid: true, 
        data,
        warnings: ['Legacy format detected - importing champion data only']
      };
    }
    
    return { isValid: false, error: 'Unrecognized file format - expected champion data' };
    
  } catch {
    return { isValid: false, error: 'Invalid JSON format' };
  }
};

/**
 * Validates an array of champions
 */
const validateChampionsArray = (champions: unknown[]): ValidationResult | null => {
  for (let i = 0; i < champions.length; i++) {
    const champ = champions[i];
    
    if (!champ || typeof champ !== 'object') {
      return { isValid: false, error: `Invalid champion data at index ${i}` };
    }
    
    const championObj = champ as Record<string, unknown>;
    
    if (typeof championObj.name !== 'string' || !championObj.name.trim()) {
      return { isValid: false, error: `Invalid champion name at index ${i}` };
    }
    
    // For new format, validate checklist
    if (championObj.checklist) {
      if (typeof championObj.checklist !== 'object') {
        return { isValid: false, error: `Missing checklist for champion: ${championObj.name}` };
      }
      
      const checklist = championObj.checklist as Record<string, unknown>;
      const { played, top4, win } = checklist;
      
      if (typeof played !== 'boolean' || typeof top4 !== 'boolean' || typeof win !== 'boolean') {
        return { isValid: false, error: `Invalid checklist data for champion: ${championObj.name}` };
      }
    }
  }
  
  return null; // No errors found
};
