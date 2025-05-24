import { Task, TASK_STATUS } from "../../types";
import DatabaseService from "./databaseService";

/**
 * Class for working with tasks in the database
 */
class TaskQueries extends DatabaseService {
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
}

export default TaskQueries;
