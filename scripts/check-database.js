#!/usr/bin/env node

/**
 * Script to check database status
 * This script checks the current state of your database without making any changes
 * 
 * Usage:
 *   node scripts/check-database.js
 *   npm run db:check
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

class DatabaseChecker {
  constructor() {
    const databaseUrl = process.env.NEON_DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('NEON_DATABASE_URL environment variable is required');
    }
    this.sql = neon(databaseUrl);
  }

  async checkConnection() {
    console.log('🔌 Testing database connection...');
    
    try {
      const result = await this.sql`SELECT 1 as test`;
      console.log('   ✅ Database connection successful');
      return true;
    } catch (error) {
      console.log('   ❌ Database connection failed:', error.message);
      return false;
    }
  }

  async checkTables() {
    console.log('📋 Checking tables...');
    
    try {
      const tables = await this.sql`
        SELECT t.table_name, 
               c.cnt as columns
        FROM information_schema.tables t
        LEFT JOIN (
          SELECT table_name, COUNT(*) as cnt
          FROM information_schema.columns 
          WHERE table_schema = 'public'
          GROUP BY table_name
        ) c ON t.table_name = c.table_name
        WHERE t.table_schema = 'public' 
        ORDER BY t.table_name
      `;

      if (tables.length === 0) {
        console.log('   ⚠️  No tables found');
        return false;
      }

      tables.forEach(table => {
        console.log(`   ✅ ${table.table_name} (${table.columns || 0} columns)`);
      });

      return true;
    } catch (error) {
      console.log('   ❌ Error checking tables:', error.message);
      return false;
    }
  }

  async checkData() {
    console.log('📊 Checking data...');
    
    try {
      // Check if required tables exist
      const requiredTables = ['users', 'arena_matches', 'migrations'];
      const tableCheck = await this.sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ANY(${requiredTables})
      `;

      const existingTables = tableCheck.map(t => t.table_name);
      const missingTables = requiredTables.filter(t => !existingTables.includes(t));

      if (missingTables.length > 0) {
        console.log(`   ⚠️  Missing tables: ${missingTables.join(', ')}`);
        console.log('   💡 Run "npm run db:recreate" to create all tables');
        return false;
      }

      // Get row counts
      const userCount = await this.sql`SELECT COUNT(*) as count FROM users`;
      const matchCount = await this.sql`SELECT COUNT(*) as count FROM arena_matches`;
      const migrationCount = await this.sql`SELECT COUNT(*) as count FROM migrations`;

      console.log(`   👥 Users: ${userCount[0].count}`);
      console.log(`   🎮 Arena matches: ${matchCount[0].count}`);
      console.log(`   📝 Migrations: ${migrationCount[0].count}`);

      return true;
    } catch (error) {
      console.log('   ❌ Error checking data:', error.message);
      return false;
    }
  }

  async checkIndexes() {
    console.log('🔍 Checking indexes...');
    
    try {
      const indexes = await this.sql`
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public'
        AND indexname NOT LIKE '%_pkey'
        ORDER BY tablename, indexname
      `;

      if (indexes.length === 0) {
        console.log('   ⚠️  No custom indexes found');
        return false;
      }

      indexes.forEach(index => {
        console.log(`   ✅ ${index.tablename}.${index.indexname}`);
      });

      return true;
    } catch (error) {
      console.log('   ❌ Error checking indexes:', error.message);
      return false;
    }
  }

  async getRecentActivity() {
    console.log('⏰ Checking recent activity...');
    
    try {
      // Check if users table exists first
      const tableCheck = await this.sql`
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'users'
      `;

      if (tableCheck.length === 0) {
        console.log('   ⚠️  Users table not found');
        return;
      }

      const recentUsers = await this.sql`
        SELECT game_name, tag_line, created_at
        FROM users 
        ORDER BY created_at DESC 
        LIMIT 3
      `;

      if (recentUsers.length === 0) {
        console.log('   📭 No users found');
        return;
      }

      console.log('   📅 Recent users:');
      recentUsers.forEach(user => {
        const date = new Date(user.created_at).toLocaleDateString();
        console.log(`      • ${user.game_name}#${user.tag_line} (${date})`);
      });

    } catch (error) {
      console.log('   ❌ Error checking recent activity:', error.message);
    }
  }

  async check() {
    console.log('🔍 Database Status Check\n');
    
    const connectionOk = await this.checkConnection();
    console.log('');
    
    if (!connectionOk) {
      console.log('❌ Database check failed - cannot connect to database');
      process.exit(1);
    }

    const tablesOk = await this.checkTables();
    console.log('');
    
    const dataOk = await this.checkData();
    console.log('');
    
    const indexesOk = await this.checkIndexes();
    console.log('');
    
    await this.getRecentActivity();
    console.log('');

    if (tablesOk && dataOk && indexesOk) {
      console.log('✅ Database is healthy and ready to use!');
    } else {
      console.log('⚠️  Database has some issues. Consider running "npm run db:recreate" to fix them.');
    }
  }
}

// Main execution
async function main() {
  try {
    const checker = new DatabaseChecker();
    await checker.check();
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();

export { DatabaseChecker };
