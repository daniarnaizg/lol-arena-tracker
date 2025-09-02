#!/usr/bin/env node

/**
 * Script to recreate database tables
 * This script will drop existing tables and recreate them with the latest schema
 * 
 * Usage:
 *   node scripts/recreate-tables.js
 * 
 * Environment Variables Required:
 *   NEON_DATABASE_URL - Your Neon database connection string
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

class TableRecreator {
  constructor() {
    const databaseUrl = process.env.NEON_DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('NEON_DATABASE_URL environment variable is required');
    }
    this.sql = neon(databaseUrl);
  }

  async dropTables() {
    console.log('🗑️  Dropping existing tables...');
    
    try {
      // Drop tables in reverse order due to foreign key constraints
      await this.sql`DROP TABLE IF EXISTS arena_matches CASCADE`;
      console.log('   ✅ Dropped arena_matches table');
      
      await this.sql`DROP TABLE IF EXISTS users CASCADE`;
      console.log('   ✅ Dropped users table');
      
      await this.sql`DROP TABLE IF EXISTS migrations CASCADE`;
      console.log('   ✅ Dropped migrations table');
      
      console.log('🎯 All tables dropped successfully');
    } catch (error) {
      console.error('❌ Error dropping tables:', error);
      throw error;
    }
  }

  async createTables() {
    console.log('🏗️  Creating tables...');
    
    try {
      // Create migration tracking table
      await this.sql`
        CREATE TABLE migrations (
          version INTEGER PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `;
      console.log('   ✅ Created migrations table');

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
      console.log('   ✅ Created users table');

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
      console.log('   ✅ Created arena_matches table');

      console.log('🎯 All tables created successfully');
    } catch (error) {
      console.error('❌ Error creating tables:', error);
      throw error;
    }
  }

  async createIndexes() {
    console.log('📊 Creating indexes...');
    
    try {
      // Create indexes for better query performance
      await this.sql`CREATE INDEX idx_users_puuid ON users(puuid)`;
      console.log('   ✅ Created index on users.puuid');
      
      await this.sql`CREATE INDEX idx_arena_matches_user_id ON arena_matches(user_id)`;
      console.log('   ✅ Created index on arena_matches.user_id');
      
      await this.sql`CREATE INDEX idx_arena_matches_patch_version ON arena_matches(patch_version)`;
      console.log('   ✅ Created index on arena_matches.patch_version');
      
      await this.sql`CREATE INDEX idx_arena_matches_champion_name ON arena_matches(champion_name)`;
      console.log('   ✅ Created index on arena_matches.champion_name');

      await this.sql`CREATE INDEX idx_arena_matches_game_creation ON arena_matches(game_creation_timestamp)`;
      console.log('   ✅ Created index on arena_matches.game_creation_timestamp');

      console.log('🎯 All indexes created successfully');
    } catch (error) {
      console.error('❌ Error creating indexes:', error);
      throw error;
    }
  }

  async markMigrationComplete() {
    console.log('📝 Marking migration as complete...');
    
    try {
      await this.sql`
        INSERT INTO migrations (version, name) VALUES (1, 'initial_schema')
      `;
      console.log('   ✅ Migration marked as complete');
    } catch (error) {
      console.error('❌ Error marking migration complete:', error);
      throw error;
    }
  }

  async verifyTables() {
    console.log('🔍 Verifying tables...');
    
    try {
      const tables = await this.sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'arena_matches', 'migrations')
        ORDER BY table_name
      `;

      console.log('📋 Available tables:');
      tables.forEach(table => {
        console.log(`   ✅ ${table.table_name}`);
      });

      // Check table row counts
      const userCount = await this.sql`SELECT COUNT(*) as count FROM users`;
      const matchCount = await this.sql`SELECT COUNT(*) as count FROM arena_matches`;
      const migrationCount = await this.sql`SELECT COUNT(*) as count FROM migrations`;

      console.log('📊 Table statistics:');
      console.log(`   👥 Users: ${userCount[0].count}`);
      console.log(`   🎮 Arena matches: ${matchCount[0].count}`);
      console.log(`   📝 Migrations: ${migrationCount[0].count}`);

      console.log('🎯 Database verification complete');
    } catch (error) {
      console.error('❌ Error verifying tables:', error);
      throw error;
    }
  }

  async recreate() {
    console.log('🚀 Starting database table recreation...\n');
    
    try {
      await this.dropTables();
      console.log('');
      
      await this.createTables();
      console.log('');
      
      await this.createIndexes();
      console.log('');
      
      await this.markMigrationComplete();
      console.log('');
      
      await this.verifyTables();
      console.log('');
      
      console.log('🎉 Database recreation completed successfully!');
      console.log('💡 Your database is now ready with fresh, empty tables.');
      
    } catch (error) {
      console.error('\n❌ Database recreation failed:', error);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  try {
    const recreator = new TableRecreator();
    await recreator.recreate();
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();

export { TableRecreator };
