// services/ddragon.ts
export interface DDragonChampion {
  id: string;
  key: string;
  name: string;
  title: string;
  image: {
    full: string;
    sprite: string;
    group: string;
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export interface DDragonResponse {
  type: string;
  format: string;
  version: string;
  data: Record<string, DDragonChampion>;
}

export interface Champion {
  id: number;
  name: string;
  imageKey: string;
  checklist: {
    played: boolean;
    top4: boolean;
    win: boolean;
  };
}

class DDragonService {
  private baseUrl: string;
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private cacheTTL: number = 60 * 60 * 1000; // 1 hour

  constructor() {
    this.baseUrl = process.env.DDRAGON_BASE_URL || process.env.NEXT_PUBLIC_DDRAGON_BASE_URL || 'https://ddragon.leagueoflegends.com';
    // We'll fetch the current patch dynamically from the API
  }

  private async fetchWithCache<T>(url: string): Promise<T> {
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.data as T;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch from DDragon: ${response.statusText}`);
    }

    const data = await response.json();
    this.cache.set(url, { data, timestamp: Date.now() });
    return data;
  }

  async getLatestVersion(): Promise<string> {
    const url = `${this.baseUrl}/api/versions.json`;
    const versions: string[] = await this.fetchWithCache(url);
    return versions[0]; // Latest version is always first
  }

  async getChampions(version?: string): Promise<DDragonResponse> {
    const patchVersion = version || await this.getLatestVersion();
    const url = `${this.baseUrl}/cdn/${patchVersion}/data/en_US/champion.json`;
    return this.fetchWithCache(url);
  }

  transformDDragonToAppFormat(ddragonData: DDragonResponse): Champion[] {
    const champions: Champion[] = [];
    let idCounter = 1;

    // Sort champions alphabetically by name for consistent ordering
    const sortedChampions = Object.values(ddragonData.data).sort((a, b) => 
      a.name.localeCompare(b.name)
    );

    for (const champion of sortedChampions) {
      champions.push({
        id: idCounter++,
        name: champion.name,
        imageKey: champion.id, // DDragon uses champion.id as the image key
        checklist: {
          played: false,
          top4: false,
          win: false
        }
      });
    }

    return champions;
  }

  // Merge existing user progress with new champion data
  mergeWithUserProgress(newChampions: Champion[], existingChampions: Champion[]): Champion[] {
    const existingMap = new Map(
      existingChampions.map(champ => [champ.name, champ])
    );

    return newChampions.map(newChamp => {
      const existing = existingMap.get(newChamp.name);
      if (existing) {
        // Preserve user progress but update id and imageKey if needed
        return {
          ...newChamp,
          checklist: existing.checklist
        };
      }
      return newChamp;
    });
  }

  // Get champion image URL
  async getChampionImageUrl(imageKey: string, version?: string): Promise<string> {
    const patchVersion = version || await this.getLatestVersion();
    return `${this.baseUrl}/cdn/${patchVersion}/img/champion/${imageKey}.png`;
  }

  // Synchronous version that uses a default fallback for immediate use
  getChampionImageUrlSync(imageKey: string, version: string = '15.1.1'): string {
    return `${this.baseUrl}/cdn/${version}/img/champion/${imageKey}.png`;
  }
}

export const ddragonService = new DDragonService();
