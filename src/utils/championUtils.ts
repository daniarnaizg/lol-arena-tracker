// utils/championUtils.ts

// utils/championUtils.ts

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
