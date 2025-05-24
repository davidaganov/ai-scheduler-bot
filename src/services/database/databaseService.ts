import Database from "better-sqlite3";
import path from "path";

/**
 * Database service for managing tasks and projects using SQLite
 */
class DatabaseService {
  protected db: Database.Database;

  constructor() {
    this.db = new Database(path.resolve(__dirname, "../../../db/tasks.db"));
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
        created_at TEXT NOT NULL
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
        name TEXT UNIQUE NOT NULL,
        created_at TEXT NOT NULL
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
  }
}

export default DatabaseService;
