import { Pool } from 'pg';
import { loadEnv } from '../config/env.js';

let sharedPool = null;

function buildPoolOptions(connectionString) {
  const useSsl = /sslmode=(require|verify-ca|verify-full)/.test(connectionString || '');
  return {
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  };
}

export function createPool(connectionString) {
  return new Pool(buildPoolOptions(connectionString));
}

export function setPool(nextPool) {
  sharedPool = nextPool;
}

export function getPool() {
  if (sharedPool) {
    return sharedPool;
  }
  const env = loadEnv(process.env);
  sharedPool = createPool(env.DATABASE_URL);
  return sharedPool;
}

export function query(text, params) {
  return getPool().query(text, params);
}

export async function closePool() {
  if (sharedPool) {
    await sharedPool.end();
    sharedPool = null;
  }
}
