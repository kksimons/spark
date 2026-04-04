import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

interface PreparedStmt {
  run: (...args: unknown[]) => unknown;
  get: (...args: unknown[]) => Record<string, unknown> | undefined;
  all: (...args: unknown[]) => Record<string, unknown>[];
}

interface Db {
  pragma(pragma: string): unknown;
  exec(sql: string): unknown;
  prepare(sql: string): PreparedStmt;
}

let db: Db;

const isBun = typeof (globalThis as Record<string, unknown>).Bun !== "undefined";

if (isBun) {
  const { Database: BunDb } = await import("bun:sqlite" as string);
  const raw = new (BunDb as new (path: string) => { exec(s: string): unknown; prepare(s: string): { run(...a: unknown[]): unknown; get(...a: unknown[]): unknown; all(...a: unknown[]): unknown[] } })(path.join(dataDir, "spark.db"));
  db = {
    pragma: (p) => raw.exec(`PRAGMA ${p}`),
    exec: (s) => raw.exec(s),
    prepare: (s) => {
      const stmt = raw.prepare(s);
      return {
        run: (...a) => stmt.run(...a),
        get: (...a) => stmt.get(...a) as Record<string, unknown> | undefined,
        all: (...a) => stmt.all(...a) as Record<string, unknown>[],
      };
    },
  };
} else {
  const Database = (await import("better-sqlite3")).default;
  db = new Database(path.join(dataDir, "spark.db")) as unknown as Db;
}

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    idea TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    summary TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    persona TEXT NOT NULL,
    round INTEGER DEFAULT 1,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'complete',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
  );

  CREATE TABLE IF NOT EXISTS specs (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    github_url TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
  );

  CREATE TABLE IF NOT EXISTS spec_versions (
    id TEXT PRIMARY KEY,
    spec_id TEXT NOT NULL,
    content TEXT NOT NULL,
    version INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (spec_id) REFERENCES specs(id)
  );
`);

export const createSession = db.prepare(
  "INSERT INTO sessions (id, idea, status) VALUES (?, ?, ?)"
);
export const updateSession = db.prepare(
  "UPDATE sessions SET status = ?, summary = ? WHERE id = ?"
);
export const getSession = db.prepare("SELECT * FROM sessions WHERE id = ?");
export const listSessions = db.prepare(
  "SELECT * FROM sessions ORDER BY created_at DESC"
);

export const insertMessage = db.prepare(
  "INSERT INTO messages (id, session_id, persona, round, content, status) VALUES (?, ?, ?, ?, ?, ?)"
);
export const getMessages = db.prepare(
  "SELECT * FROM messages WHERE session_id = ? ORDER BY round ASC, created_at ASC"
);

export const createSpec = db.prepare(
  "INSERT INTO specs (id, session_id, content, version) VALUES (?, ?, ?, ?)"
);
export const getSpec = db.prepare("SELECT * FROM specs WHERE session_id = ?");
export const updateSpec = db.prepare(
  "UPDATE specs SET content = ?, version = version + 1, github_url = ?, updated_at = CURRENT_TIMESTAMP WHERE session_id = ?"
);
export const insertSpecVersion = db.prepare(
  "INSERT INTO spec_versions (id, spec_id, content, version) VALUES (?, ?, ?, ?)"
);
export const getSpecVersions = db.prepare(
  "SELECT * FROM spec_versions WHERE spec_id = ? ORDER BY version DESC"
);

export default db;
