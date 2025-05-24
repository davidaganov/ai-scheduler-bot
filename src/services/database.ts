import Database from "better-sqlite3";
import path from "path";
import { type Task, TASK_STATUS } from "../types";

/**
 * Database service for managing tasks and projects using SQLite
 */
class DatabaseService {
  private db: Database.Database;

  constructor() {
    this.db = new Database(path.resolve(__dirname, "../../db/tasks.db"));
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

  /**
   * Add a new task to the database
   * @param task - Task object without ID
   * @returns The ID of the created task
   */
  public addTask(task: Omit<Task, "id">): number {
    const stmt = this.db.prepare(`
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
   * Get a task by its ID
   * @param id - Task ID
   * @returns Task object or undefined if not found
   */
  public getTaskById(id: number): Task | undefined {
    const task = this.db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id) as
      | any
      | undefined;

    if (!task) return undefined;

    return task as Task;
  }

  /**
   * Get all tasks ordered by ID (newest first)
   * @returns Array of all tasks
   */
  public getAllTasks(): Task[] {
    const tasks = this.db
      .prepare(`SELECT * FROM tasks ORDER BY id DESC`)
      .all() as any[];

    return tasks.map((task) => task as Task);
  }

  /**
   * Get tasks filtered by status and/or project
   * @param filter - Filter criteria
   * @returns Array of filtered tasks
   */
  public getTasksByFilter(filter: {
    status?: string;
    project?: string;
  }): Task[] {
    let query = `SELECT * FROM tasks WHERE 1=1`;
    const params: any[] = [];

    if (filter.status) {
      query += ` AND status = ?`;
      params.push(filter.status);
    }

    if (filter.project) {
      query += ` AND project = ?`;
      params.push(filter.project);
    }

    query += ` ORDER BY id DESC`;

    const tasks = this.db.prepare(query).all(...params) as any[];

    return tasks.map((task) => task as Task);
  }

  /**
   * Update task status
   * @param id - Task ID
   * @param status - New status
   * @returns True if task was updated, false otherwise
   */
  public updateTaskStatus(id: number, status: TASK_STATUS): boolean {
    const result = this.db
      .prepare(`UPDATE tasks SET status = ? WHERE id = ?`)
      .run(status, id);

    return result.changes > 0;
  }

  /**
   * Delete a task by ID
   * @param id - Task ID
   * @returns True if task was deleted, false otherwise
   */
  public deleteTask(id: number): boolean {
    const result = this.db.prepare(`DELETE FROM tasks WHERE id = ?`).run(id);

    return result.changes > 0;
  }

  /**
   * Get all project names from both projects table and tasks
   * @returns Sorted array of unique project names
   */
  public getProjects(): string[] {
    // Get projects from dedicated table + projects with tasks
    const projectsFromTable = this.db
      .prepare(`SELECT name FROM projects ORDER BY name`)
      .all()
      .map((row: any) => row.name);

    const projectsFromTasks = this.db
      .prepare(`SELECT DISTINCT project FROM tasks ORDER BY project`)
      .all()
      .map((row: any) => row.project);

    // Combine and remove duplicates
    const allProjects = Array.from(
      new Set([...projectsFromTable, ...projectsFromTasks])
    );

    return allProjects.sort();
  }

  /**
   * Add a new project
   * @param projectName - Name of the project
   * @returns True if project was added, false if it already exists
   */
  public addProject(projectName: string): boolean {
    try {
      const result = this.db
        .prepare(
          `
        INSERT INTO projects (name, created_at)
        VALUES (?, ?)
      `
        )
        .run(projectName, new Date().toISOString());

      return result.changes > 0;
    } catch (error) {
      // Project already exists
      return false;
    }
  }

  /**
   * Delete all tasks from a project
   * @param projectName - Name of the project
   * @returns True if tasks were deleted, false otherwise
   */
  public clearProject(projectName: string): boolean {
    const result = this.db
      .prepare(`DELETE FROM tasks WHERE project = ?`)
      .run(projectName);

    return result.changes > 0;
  }

  /**
   * Delete a project and all its tasks
   * @param projectName - Name of the project
   * @returns True if project or tasks were deleted, false otherwise
   */
  public deleteProject(projectName: string): boolean {
    // Delete project from projects table
    const projectResult = this.db
      .prepare(`DELETE FROM projects WHERE name = ?`)
      .run(projectName);

    // Delete all tasks of this project
    const tasksResult = this.db
      .prepare(`DELETE FROM tasks WHERE project = ?`)
      .run(projectName);

    return projectResult.changes > 0 || tasksResult.changes > 0;
  }

  /**
   * Get statistics for a specific project
   * @param projectName - Name of the project
   * @returns Object with task counts by status
   */
  public getProjectStats(projectName: string): {
    total: number;
    notStarted: number;
    inProgress: number;
    done: number;
  } {
    const stats = this.db
      .prepare(
        `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'not_started' THEN 1 ELSE 0 END) as notStarted,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as inProgress,
        SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done
      FROM tasks
      WHERE project = ?
    `
      )
      .get(projectName) as any;

    return {
      total: stats.total || 0,
      notStarted: stats.notStarted || 0,
      inProgress: stats.inProgress || 0,
      done: stats.done || 0,
    };
  }

  /**
   * Check if a project exists
   * @param projectName - Name of the project
   * @returns True if project exists, false otherwise
   */
  public projectExists(projectName: string): boolean {
    const project = this.db
      .prepare(`SELECT 1 FROM projects WHERE name = ? LIMIT 1`)
      .get(projectName);

    return !!project;
  }
}

export default new DatabaseService();
