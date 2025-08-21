/**
 * Service for fetching and managing champion arena data
 */

// Define the data structure based on the JSON files
export interface ChampionArenaData {
  name: string;
  tier: string;
  stats: {
    winRate: string;
    [key: string]: string | number | boolean | undefined;
  };
  augments: {
    prismatic: AugmentItem[];
    gold: AugmentItem[];
    silver: AugmentItem[];
    [key: string]: AugmentItem[] | undefined;
  };
  items: {
    core: ItemData[];
    boots: ItemData[];
    situational: ItemData[];
    [key: string]: ItemData[] | undefined;
  };
  prismaticItemTierList?: ItemData[];
  [key: string]: string | number | boolean | object | undefined;
}

export interface AugmentItem {
  name: string;
  imageUrl: string;
}

export interface ItemData {
  name: string;
  imageUrl: string;
}

/**
 * Fetches champion arena data from the public/data directory
 */
export const fetchChampionArenaData = async (championKey: string): Promise<ChampionArenaData | null> => {
  if (!championKey) {
    console.error('Champion key is required');
    return null;
  }

  try {
    // Convert the key to lowercase for the filename and remove any special characters
    const normalizedKey = championKey.toLowerCase()
      .replace(/[^a-z0-9]/g, ''); // Remove special characters
    
    // Fetch the JSON data from the public directory
    const response = await fetch(`/data/${normalizedKey}.json`, {
      headers: {
        'Cache-Control': 'no-cache', // Avoid caching issues during development
      },
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch data for champion: ${championKey} (${normalizedKey}.json), status: ${response.status}`);
      return null;
    }
    
    const data: ChampionArenaData = await response.json();
    
    // Basic validation of the fetched data
    if (!data || typeof data !== 'object') {
      console.error(`Invalid data format for champion: ${championKey}`);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching champion arena data for ${championKey}:`, error);
    return null;
  }
};
