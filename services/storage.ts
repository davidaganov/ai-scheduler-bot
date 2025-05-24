import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.resolve(__dirname, "../db/tasks.db"));

/**
 * Create table if it doesn't exist
 */
db.prepare(
  `
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT,
    project TEXT,
    status TEXT,
    created_at TEXT
  )
`
).run();

/**
 * Add a new task to the database
 * @param task - Task object with description, project, status, and created_at
 * @returns The ID of the created task
 */
export function addTask(task: {
  description: string;
  project: string;
  status: string;
  created_at: string;
}): number {
  const stmt = db.prepare(`
    INSERT INTO tasks (description, project, status, created_at)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(
    task.description,
    task.project,
    task.status,
    task.created_at
  );
  return result.lastInsertRowid as number;
}

/**
 * Get all tasks ordered by ID (newest first)
 * @returns Array of all tasks
 */
export function getAllTasks(): any[] {
  return db.prepare(`SELECT * FROM tasks ORDER BY id DESC`).all();
}

/**
 * Get tasks filtered by status
 * @param status - Task status to filter by
 * @returns Array of tasks with the specified status
 */
export function getTasksByStatus(status: string): any[] {
  return db
    .prepare(`SELECT * FROM tasks WHERE status = ? ORDER BY id DESC`)
    .all(status);
}

/**
 * Update task status
 * @param id - Task ID
 * @param status - New status
 * @returns True if task was updated, false otherwise
 */
export function updateTaskStatus(id: number, status: string): boolean {
  const result = db
    .prepare(`UPDATE tasks SET status = ? WHERE id = ?`)
    .run(status, id);
  return result.changes > 0;
}

/**
 * Delete a task by ID
 * @param id - Task ID
 * @returns True if task was deleted, false otherwise
 */
export function deleteTask(id: number): boolean {
  const result = db.prepare(`DELETE FROM tasks WHERE id = ?`).run(id);
  return result.changes > 0;
}
