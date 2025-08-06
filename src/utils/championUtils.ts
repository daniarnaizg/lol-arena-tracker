// utils/championUtils.ts

// utils/championUtils.ts

import { Champion } from '@/services/ddragon';
import { SortType } from '@/components/ui';

/**
 * Normalizes champion names by removing special characters that might differ
 * between different data sources (Riot API vs DDragon)
 * 
 * Examples:
 * - "Vel'Koz" → "velkoz"
 * - "Kai'Sa" → "kaisa"  
 * - "Cho'Gath" → "chogath"
 * - "Dr. Mundo" → "drmundo"
 * - "Jarvan IV" → "jarvaniv"
 * - "Aurelion Sol" → "aurelionsol"
 * - "LeBlanc" → "leblanc"
 * - "Master Yi" → "masteryi"
 */
export const normalizeChampionName = (name: string): string => {
  return name
    .replace(/'/g, '')       // Remove apostrophes: Vel'Koz → VelKoz
    .replace(/\./g, '')      // Remove periods: Dr. Mundo → Dr Mundo
    .replace(/\s+/g, '')     // Remove all spaces: Master Yi → MasterYi, Aurelion Sol → AurelionSol
    .toLowerCase()           // Convert to lowercase for consistent comparison
    .trim();
};

/**
 * Checks if two champion names match after normalization
 */
export const isChampionNameMatch = (name1: string, name2: string): boolean => {
  return normalizeChampionName(name1) === normalizeChampionName(name2);
};

/**
 * Searches for a champion name within a text string using normalized comparison
 */
export const championNameIncludes = (championName: string, searchTerm: string): boolean => {
  const normalizedChampionName = normalizeChampionName(championName);
  const normalizedSearchTerm = normalizeChampionName(searchTerm);
  return normalizedChampionName.includes(normalizedSearchTerm);
};

/**
 * Gets the state priority for sorting champions by progress
 * Higher numbers = higher priority (shown first)
 */
export const getChampionStatePriority = (champion: Champion): number => {
  const checklist = champion.checklist || { played: false, top4: false, win: false };
  
  if (checklist.win) return 4;      // Win (highest priority)
  if (checklist.top4) return 3;     // Top 4
  if (checklist.played) return 2;   // Played
  return 1;                         // Unplayed (lowest priority)
};

/**
 * Sorts champions based on the selected sort type
 */
export const sortChampions = (champions: Champion[], sortBy: SortType): Champion[] => {
  const sorted = [...champions];
  
  if (sortBy === 'alphabetical') {
    return sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  if (sortBy === 'status') {
    return sorted.sort((a, b) => {
      const priorityA = getChampionStatePriority(a);
      const priorityB = getChampionStatePriority(b);
      
      // Primary sort: by state priority (descending)
      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }
      
      // Secondary sort: alphabetically (ascending)
      return a.name.localeCompare(b.name);
    });
  }
  
  return sorted;
};
