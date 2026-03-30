/**
 * Simple JSON key-value cache backed by SQLite.
 * Used as a read fallback when Supabase is unreachable (offline).
 *
 * Pattern in each service:
 *   try { data = await supabase.from(...); await cacheSet(key, data); return data; }
 *   catch { return await cacheGet(key) ?? defaultValue; }
 */
import * as SQLite from 'expo-sqlite';

let _db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync('offline_cache.db');
  await _db.execAsync(
    `CREATE TABLE IF NOT EXISTS cache (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`,
  );
  return _db;
}

export async function cacheSet(key: string, value: unknown): Promise<void> {
  try {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO cache (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      [key, JSON.stringify(value), new Date().toISOString()],
    );
  } catch { /* non-fatal: cache write failure should never break the app */ }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const db = await getDb();
    const row = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM cache WHERE key = ?`,
      [key],
    );
    if (!row) return null;
    return JSON.parse(row.value) as T;
  } catch {
    return null;
  }
}
