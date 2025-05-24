import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

/**
 * Database service for managing tasks and projects using SQLite
 */
class DatabaseService {
  protected db: Database.Database;

  constructor() {
    const dbDir = path.resolve(__dirname, "../../../db");
    const dbPath = path.join(dbDir, "tasks.db");

    // Ensure database directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.initialize();
  }

  /**
   * Initialize database tables and indexes
   */
  private initialize(): void {
    this.db.pragma("journal_mode = WAL");

    // Create tasks table if it doesn't exist
    this.db
      .prepare(
        `
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        project TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        user_id INTEGER NOT NULL DEFAULT 0
      )
    `
      )
      .run();

    // Create projects table
    this.db
      .prepare(
        `
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        user_id INTEGER NOT NULL DEFAULT 0,
        UNIQUE(name, user_id)
      )
    `
      )
      .run();

    // Create indexes for better query performance
    this.db
      .prepare(
        `
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)
    `
      )
      .run();

    this.db
      .prepare(
        `
      CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project)
    `
      )
      .run();

    this.db
      .prepare(
        `
      CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)
    `
      )
      .run();

    this.db
      .prepare(
        `
      CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id)
    `
      )
      .run();
  }
}

export default DatabaseService;
