import "server-only";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { MIGRATIONS } from "./migrations";

/**
 * Portal database: a single SQLite file in DATA_DIR (next to the website's db.json), using Node's
 * built-in SQLite. WAL mode lets several server processes read and write safely.
 */
let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (db) return db;
  const dir = process.env.DATA_DIR || path.join(process.cwd(), ".data");
  mkdirSync(dir, { recursive: true });
  const conn = new DatabaseSync(path.join(dir, "portal.db"));
  conn.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON; PRAGMA synchronous = NORMAL;");
  migrate(conn);
  db = conn;
  return conn;
}

function migrate(conn: DatabaseSync) {
  const { user_version: current } = conn.prepare("PRAGMA user_version").get() as { user_version: number };
  for (let v = current; v < MIGRATIONS.length; v++) {
    conn.exec("BEGIN IMMEDIATE");
    try {
      // Another process may have migrated while we waited for the lock.
      const { user_version: now } = conn.prepare("PRAGMA user_version").get() as { user_version: number };
      if (now > v) {
        conn.exec("COMMIT");
        continue;
      }
      conn.exec(MIGRATIONS[v]);
      conn.exec(`PRAGMA user_version = ${v + 1}`);
      conn.exec("COMMIT");
    } catch (err) {
      conn.exec("ROLLBACK");
      throw err;
    }
  }
}

type Params = SQLInputValue[];

export function one<T>(sql: string, ...params: Params): T | undefined {
  return getDb().prepare(sql).get(...params) as T | undefined;
}

export function all<T>(sql: string, ...params: Params): T[] {
  return getDb().prepare(sql).all(...params) as T[];
}

export function run(sql: string, ...params: Params) {
  return getDb().prepare(sql).run(...params);
}

/** Runs fn inside a write transaction (all or nothing). */
export function tx<T>(fn: () => T): T {
  const conn = getDb();
  conn.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    conn.exec("COMMIT");
    return result;
  } catch (err) {
    conn.exec("ROLLBACK");
    throw err;
  }
}

export const now = () => new Date().toISOString();
