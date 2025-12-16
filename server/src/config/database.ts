/**
 * Database Configuration and Connection Pool
 *
 * Manages PostgreSQL connection pool and provides database utilities
 */

import { Pool, PoolClient, PoolConfig } from 'pg';
import { getEnvironment } from './environment.js';

/**
 * Database configuration interface
 */
export interface DatabaseConfig extends PoolConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

/**
 * Create database configuration from environment
 */
export function createDatabaseConfig(): DatabaseConfig {
  const env = getEnvironment();

  return {
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    max: env.DB_POOL_SIZE,
    idleTimeoutMillis: 30000, // 30 seconds
    connectionTimeoutMillis: 5000, // 5 seconds
    // Enable SSL in production
    ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  };
}

/**
 * Global database pool instance
 */
let poolInstance: Pool | null = null;

/**
 * Create and initialize database connection pool
 */
export function createPool(config?: DatabaseConfig): Pool {
  if (poolInstance) {
    return poolInstance;
  }

  const dbConfig = config || createDatabaseConfig();
  poolInstance = new Pool(dbConfig);

  // Monitor pool events
  poolInstance.on('connect', (client: PoolClient) => {
    if (process.env.DEBUG_MODE === 'true') {
      console.log('New database client connected');
    }
  });

  poolInstance.on('error', (err: Error, client: PoolClient) => {
    console.error('Unexpected database pool error:', err);
  });

  poolInstance.on('remove', (client: PoolClient) => {
    if (process.env.DEBUG_MODE === 'true') {
      console.log('Database client removed from pool');
    }
  });

  console.log('Database pool created successfully');
  console.log(`  - Host: ${dbConfig.host}`);
  console.log(`  - Port: ${dbConfig.port}`);
  console.log(`  - Database: ${dbConfig.database}`);
  console.log(`  - Max connections: ${dbConfig.max}`);

  return poolInstance;
}

/**
 * Get existing pool instance
 */
export function getPool(): Pool {
  if (!poolInstance) {
    throw new Error('Database pool not initialized. Call createPool() first.');
  }
  return poolInstance;
}

/**
 * Test database connection
 */
export async function testConnection(pool: Pool = getPool()): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    client.release();

    console.log('Database connection test successful');
    console.log(`  - Current time: ${result.rows[0].current_time}`);
    console.log(`  - PostgreSQL version: ${result.rows[0].db_version.split(',')[0]}`);

    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

/**
 * Execute a query with connection from pool
 */
export async function query<T = any>(
  text: string,
  params?: any[],
  pool: Pool = getPool()
): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Execute a transaction
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>,
  pool: Pool = getPool()
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close database pool
 */
export async function closePool(pool: Pool = getPool()): Promise<void> {
  try {
    await pool.end();
    poolInstance = null;
    console.log('Database pool closed successfully');
  } catch (error) {
    console.error('Error closing database pool:', error);
    throw error;
  }
}

/**
 * Get pool statistics
 */
export function getPoolStats(pool: Pool = getPool()): {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
} {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  };
}

/**
 * Run database migrations
 */
export async function runMigrations(pool: Pool = getPool()): Promise<void> {
  try {
    console.log('Running database migrations...');

    // Check if migrations table exists
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'coding_sessions'
      );
    `);

    if (!checkTable.rows[0].exists) {
      console.log('Database tables not found. Please run migration script manually.');
      console.log('Migration file: server/src/database/migrations/001_initial_schema.sql');
    } else {
      console.log('Database tables exist. Skipping migrations.');
    }
  } catch (error) {
    console.error('Error checking migrations:', error);
    throw error;
  }
}

/**
 * Graceful shutdown handler
 */
export function setupGracefulShutdown(pool: Pool = getPool()): void {
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Closing database connections...`);
    try {
      await closePool(pool);
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

export default {
  createPool,
  getPool,
  testConnection,
  query,
  transaction,
  closePool,
  getPoolStats,
  runMigrations,
  setupGracefulShutdown
};
