import { neon } from '@neondatabase/serverless';

interface DatabaseInfo {
  tables: number;
  users: number;
  matches: number;
}

// These interfaces will be used in future steps
interface DbUser {
  id: number;
  puuid: string;
  game_name: string;
  tag_line: string;
  region: string;
  created_at: string;
  updated_at: string;
  last_synced_at: string; // PostgreSQL timestamp - repurposed to track last processed match time
}

interface DbArenaMatch {
  id: number;
  user_id: number;
  match_id: string;
  champion_name: string;
  placement: number;
  win: boolean;
  game_creation_timestamp: number;
  game_end_timestamp: number;
  game_version: string;
  patch_version: string;
  season_year: number;
  created_at: string;
}

export class DatabaseService {
  private sql;

  constructor() {
    const databaseUrl = process.env.NEON_DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('NEON_DATABASE_URL environment variable is required');
    }
    this.sql = neon(databaseUrl);
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.sql`SELECT 1 as test`;
      console.log('✅ Database connection successful:', result);
      return true;
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      return false;
    }
  }

  /**
   * Run database migrations - creates tables if they don't exist
   */
  async runMigrations(): Promise<void> {
    try {
      console.log('🔧 Running database migrations...');

      // Create migration tracking table
      await this.sql`
        CREATE TABLE IF NOT EXISTS migrations (
          version INTEGER PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;

      // Check if initial migration has been run
      const existingMigrations = await this.sql`
        SELECT version FROM migrations WHERE version = 1
      `;

      if (existingMigrations.length === 0) {
        console.log('🏗️ Creating initial schema...');
        
        // Create users table
        await this.sql`
          CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            puuid VARCHAR(78) UNIQUE NOT NULL,
            game_name VARCHAR(100) NOT NULL,
            tag_line VARCHAR(10) NOT NULL,
            region VARCHAR(20) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `;

        // Create arena_matches table
        await this.sql`
          CREATE TABLE arena_matches (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            match_id VARCHAR(50) NOT NULL,
            champion_name VARCHAR(50) NOT NULL,
            placement INTEGER NOT NULL CHECK (placement >= 1 AND placement <= 8),
            win BOOLEAN NOT NULL,
            game_creation_timestamp BIGINT NOT NULL,
            game_end_timestamp BIGINT NOT NULL,
            game_version VARCHAR(20),
            patch_version VARCHAR(10),
            season_year INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, match_id)
          )
        `;

        // Create indexes
        await this.sql`
          CREATE INDEX idx_users_puuid ON users(puuid)
        `;
        
        await this.sql`
          CREATE INDEX idx_arena_matches_user_id ON arena_matches(user_id)
        `;
        
        await this.sql`
          CREATE INDEX idx_arena_matches_patch_version ON arena_matches(patch_version)
        `;
        
        await this.sql`
          CREATE INDEX idx_arena_matches_champion_name ON arena_matches(champion_name)
        `;

        // Mark migration as completed
        await this.sql`
          INSERT INTO migrations (version, name) VALUES (1, 'initial_schema')
        `;

        console.log('✅ Initial schema created successfully');
      } else {
        console.log('ℹ️ Database schema already exists, skipping migration');
      }

      // Verify tables exist
      const tableCheck = await this.sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'arena_matches', 'migrations')
        ORDER BY table_name
      `;

      console.log('📋 Available tables:', tableCheck.map(t => t.table_name));
      console.log('✅ Database migration completed successfully');

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  /**
   * Get basic database info for testing
   */
  async getDatabaseInfo(): Promise<DatabaseInfo | null> {
    try {
      const tableCount = await this.sql`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;

      const userCount = await this.sql`
        SELECT COUNT(*) as count FROM users
      `;

      const matchCount = await this.sql`
        SELECT COUNT(*) as count FROM arena_matches
      `;

      return {
        tables: parseInt(tableCount[0].count),
        users: parseInt(userCount[0].count),
        matches: parseInt(matchCount[0].count)
      };
    } catch (error) {
      console.error('Error getting database info:', error);
      return null;
    }
  }

  // User management methods for Step 2
  
  /**
   * Find user by Riot ID (gameName + tagLine)
   */
  async findUserByRiotId(gameName: string, tagLine: string): Promise<DbUser | null> {
    try {
      const result = await this.sql`
        SELECT * FROM users 
        WHERE LOWER(game_name) = LOWER(${gameName}) 
        AND LOWER(tag_line) = LOWER(${tagLine}) 
        LIMIT 1
      `;
      return result[0] as DbUser || null;
    } catch (error) {
      console.error('Error finding user by Riot ID:', error);
      return null;
    }
  }

  /**
   * Find user by PUUID
   */
  async findUserByPuuid(puuid: string): Promise<DbUser | null> {
    try {
      const result = await this.sql`
        SELECT * FROM users WHERE puuid = ${puuid} LIMIT 1
      `;
      return result[0] as DbUser || null;
    } catch (error) {
      console.error('Error finding user by PUUID:', error);
      return null;
    }
  }

  /**
   * Create a new user in the database
   */
  async createUser(userData: {
    puuid: string;
    gameName: string;
    tagLine: string;
    region: string;
  }): Promise<DbUser | null> {
    try {
      const result = await this.sql`
        INSERT INTO users (puuid, game_name, tag_line, region)
        VALUES (${userData.puuid}, ${userData.gameName}, ${userData.tagLine}, ${userData.region})
        RETURNING *
      `;
      console.log(`💾 Created new user: ${userData.gameName}#${userData.tagLine}`);
      return result[0] as DbUser;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  /**
   * Update user's last match timestamp (stored in last_synced_at as PostgreSQL timestamp)
   */
  async updateUserLastMatchTimestamp(userId: number, timestamp: number): Promise<boolean> {
    try {
      // Convert Unix timestamp (seconds) to PostgreSQL timestamp
      const postgresTimestamp = new Date(timestamp * 1000).toISOString();
      
      await this.sql`
        UPDATE users 
        SET last_synced_at = ${postgresTimestamp}, updated_at = NOW()
        WHERE id = ${userId}
      `;
      console.log(`📅 Updated last match timestamp for user ${userId}: ${postgresTimestamp}`);
      console.log(`   - Unix timestamp: ${timestamp} (${new Date(timestamp * 1000).toISOString()})`);
      return true;
    } catch (error) {
      console.error('Error updating last match timestamp:', error);
      return false;
    }
  }

  /**
   * Get user's last match timestamp from last_synced_at field
   */
  getUserLastMatchTimestamp(user: DbUser): number | null {
    try {
      // Parse the PostgreSQL timestamp and convert to Unix timestamp
      const date = new Date(user.last_synced_at);
      if (isNaN(date.getTime())) {
        console.log(`⚠️ Invalid last_synced_at timestamp for user ${user.id}: ${user.last_synced_at}`);
        return null;
      }
      
      const unixTimestamp = Math.floor(date.getTime() / 1000);
      
      // Basic validation - should be a reasonable Unix timestamp
      if (unixTimestamp < 1000000000 || unixTimestamp > 2147483647) {
        console.log(`⚠️ Invalid Unix timestamp range for user ${user.id}: ${unixTimestamp}`);
        return null;
      }
      
      console.log(`📅 User ${user.id} last match timestamp: ${unixTimestamp} (${date.toISOString()})`);
      return unixTimestamp;
    } catch (error) {
      console.error(`❌ Error parsing last match timestamp for user ${user.id}:`, error);
      return null;
    }
  }

  /**
   * Find arena matches for a user
   */
  async findArenaMatches(userId: number, limit: number = 20): Promise<DbArenaMatch[]> {
    try {
      const result = await this.sql`
        SELECT * FROM arena_matches 
        WHERE user_id = ${userId} 
        ORDER BY created_at DESC 
        LIMIT ${limit}
      `;
      return result as DbArenaMatch[];
    } catch (error) {
      console.error('Error finding arena matches:', error);
      return [];
    }
  }

  /**
   * Find arena matches for a user with filtering options
   */
  async findArenaMatchesFiltered(userId: number, filters: {
    limit?: number;
    startDate?: number; // Unix timestamp
    endDate?: number;   // Unix timestamp
    patch?: string;     // e.g., "14.19"
    season?: number;    // e.g., 2024
  } = {}): Promise<DbArenaMatch[]> {
    try {
      const { 
        limit = 50, 
        startDate, 
        endDate, 
        patch, 
        season 
      } = filters;

      // Ensure reasonable bounds for limit
      const safeLimit = Math.min(Math.max(limit, 1), 500);

      console.log('🔍 Database query with filters:', { userId, startDate, endDate, patch, season, limit: safeLimit });

      // Execute query based on conditions
      if (startDate !== undefined && endDate !== undefined && patch && season !== undefined) {
        const result = await this.sql`
          SELECT * FROM arena_matches 
          WHERE user_id = ${userId} 
            AND game_creation_timestamp >= ${startDate}
            AND game_creation_timestamp <= ${endDate}
            AND patch_version = ${patch}
            AND season_year = ${season}
          ORDER BY game_creation_timestamp DESC 
          LIMIT ${safeLimit}
        `;
        return result as DbArenaMatch[];
      } else if (startDate !== undefined && endDate !== undefined && patch) {
        const result = await this.sql`
          SELECT * FROM arena_matches 
          WHERE user_id = ${userId} 
            AND game_creation_timestamp >= ${startDate}
            AND game_creation_timestamp <= ${endDate}
            AND patch_version = ${patch}
          ORDER BY game_creation_timestamp DESC 
          LIMIT ${safeLimit}
        `;
        return result as DbArenaMatch[];
      } else if (startDate !== undefined && endDate !== undefined) {
        const result = await this.sql`
          SELECT * FROM arena_matches 
          WHERE user_id = ${userId} 
            AND game_creation_timestamp >= ${startDate}
            AND game_creation_timestamp <= ${endDate}
          ORDER BY game_creation_timestamp DESC 
          LIMIT ${safeLimit}
        `;
        return result as DbArenaMatch[];
      } else if (patch && season !== undefined) {
        const result = await this.sql`
          SELECT * FROM arena_matches 
          WHERE user_id = ${userId} 
            AND patch_version = ${patch}
            AND season_year = ${season}
          ORDER BY game_creation_timestamp DESC 
          LIMIT ${safeLimit}
        `;
        return result as DbArenaMatch[];
      } else if (patch) {
        const result = await this.sql`
          SELECT * FROM arena_matches 
          WHERE user_id = ${userId} 
            AND patch_version = ${patch}
          ORDER BY game_creation_timestamp DESC 
          LIMIT ${safeLimit}
        `;
        return result as DbArenaMatch[];
      } else if (season !== undefined) {
        const result = await this.sql`
          SELECT * FROM arena_matches 
          WHERE user_id = ${userId} 
            AND season_year = ${season}
          ORDER BY game_creation_timestamp DESC 
          LIMIT ${safeLimit}
        `;
        return result as DbArenaMatch[];
      } else if (startDate !== undefined) {
        const result = await this.sql`
          SELECT * FROM arena_matches 
          WHERE user_id = ${userId} 
            AND game_creation_timestamp >= ${startDate}
          ORDER BY game_creation_timestamp DESC 
          LIMIT ${safeLimit}
        `;
        return result as DbArenaMatch[];
      } else if (endDate !== undefined) {
        const result = await this.sql`
          SELECT * FROM arena_matches 
          WHERE user_id = ${userId} 
            AND game_creation_timestamp <= ${endDate}
          ORDER BY game_creation_timestamp DESC 
          LIMIT ${safeLimit}
        `;
        return result as DbArenaMatch[];
      } else {
        // No filters, just return recent matches
        const result = await this.sql`
          SELECT * FROM arena_matches 
          WHERE user_id = ${userId}
          ORDER BY game_creation_timestamp DESC 
          LIMIT ${safeLimit}
        `;
        return result as DbArenaMatch[];
      }
    } catch (error) {
      console.error('Error finding filtered arena matches:', error);
      return [];
    }
  }

  /**
   * Get metadata about user's matches (date ranges, available patches, seasons, etc.)
   */
  async getMatchMetadata(userId: number): Promise<{
    totalMatches: number;
    dateRange: {
      earliest: number;
      latest: number;
      earliestFormatted: string;
      latestFormatted: string;
    } | null;
    availablePatches: string[];
    availableSeasons: number[];
    championsPlayed: number;
  }> {
    try {
      // Get basic counts and date range
      const basicStats = await this.sql`
        SELECT 
          COUNT(*) as total_matches,
          MIN(game_creation_timestamp) as earliest_match,
          MAX(game_creation_timestamp) as latest_match,
          COUNT(DISTINCT champion_name) as champions_played
        FROM arena_matches 
        WHERE user_id = ${userId}
      `;

      // Get available patches (sorted by most recent)
      const patchResults = await this.sql`
        SELECT DISTINCT patch_version 
        FROM arena_matches 
        WHERE user_id = ${userId} 
        AND patch_version IS NOT NULL
        ORDER BY patch_version DESC
      `;

      // Get available seasons
      const seasonResults = await this.sql`
        SELECT DISTINCT season_year 
        FROM arena_matches 
        WHERE user_id = ${userId} 
        AND season_year IS NOT NULL
        ORDER BY season_year DESC
      `;

      const stats = basicStats[0];
      const totalMatches = parseInt(stats.total_matches);

      let dateRange = null;
      if (totalMatches > 0 && stats.earliest_match && stats.latest_match) {
        // Database stores millisecond timestamps, convert to seconds for frontend
        const earliestMs = parseInt(stats.earliest_match);
        const latestMs = parseInt(stats.latest_match);
        const earliest = Math.floor(earliestMs / 1000);
        const latest = Math.floor(latestMs / 1000);
        
        dateRange = {
          earliest,
          latest,
          earliestFormatted: new Date(earliestMs).toISOString().split('T')[0],
          latestFormatted: new Date(latestMs).toISOString().split('T')[0]
        };
      }

      const availablePatches = patchResults.map(row => row.patch_version);
      const availableSeasons = seasonResults.map(row => parseInt(row.season_year));

      return {
        totalMatches,
        dateRange,
        availablePatches,
        availableSeasons,
        championsPlayed: parseInt(stats.champions_played)
      };

    } catch (error) {
      console.error('Error getting match metadata:', error);
      return {
        totalMatches: 0,
        dateRange: null,
        availablePatches: [],
        availableSeasons: [],
        championsPlayed: 0
      };
    }
  }

  /**
   * Check if a match already exists for a user
   */
  async matchExists(userId: number, matchId: string): Promise<boolean> {
    try {
      const result = await this.sql`
        SELECT 1 FROM arena_matches 
        WHERE user_id = ${userId} AND match_id = ${matchId}
        LIMIT 1
      `;
      return result.length > 0;
    } catch (error) {
      console.error('Error checking match existence:', error);
      return false;
    }
  }

  /**
   * Save arena match to database
   */
  async saveArenaMatch(matchData: {
    userId: number;
    matchId: string;
    championName: string;
    placement: number;
    win: boolean;
    gameCreation: number;
    gameEndTimestamp: number;
    gameVersion: string;
  }): Promise<DbArenaMatch | null> {
    try {
      // Check if match already exists
      const exists = await this.matchExists(matchData.userId, matchData.matchId);
      if (exists) {
        console.log(`🔄 Match ${matchData.matchId} already exists for user ${matchData.userId}`);
        return null;
      }

      // Extract patch version from game version (e.g., "14.19.586.4490" -> "14.19")
      const patchVersion = matchData.gameVersion.split('.').slice(0, 2).join('.');
      
      // Extract season year from game creation timestamp
      const seasonYear = new Date(matchData.gameCreation).getFullYear();

      const result = await this.sql`
        INSERT INTO arena_matches (
          user_id, match_id, champion_name, placement, win, 
          game_creation_timestamp, game_end_timestamp, game_version, 
          patch_version, season_year
        )
        VALUES (
          ${matchData.userId}, ${matchData.matchId}, ${matchData.championName},
          ${matchData.placement}, ${matchData.win}, ${matchData.gameCreation},
          ${matchData.gameEndTimestamp}, ${matchData.gameVersion}, 
          ${patchVersion}, ${seasonYear}
        )
        RETURNING *
      `;
      
      console.log(`💾 Saved arena match: ${matchData.championName} (Placement: ${matchData.placement}, ${matchData.win ? 'Win' : 'Loss'})`);
      return result[0] as DbArenaMatch;
    } catch (error) {
      console.error('Error saving arena match:', error);
      return null;
    }
  }
}

export const databaseService = new DatabaseService();
