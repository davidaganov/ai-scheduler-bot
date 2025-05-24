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
      INSERT INTO tasks (description, project, status, created_at, user_id)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      task.description,
      task.project,
      task.status,
      task.created_at,
      task.user_id
    );

    return result.lastInsertRowid as number;
  }

  /**
   * Get a task by its ID
   * @param id - Task ID
   * @param userId - User ID
   * @returns Task object or undefined if not found
   */
  public getTaskById(id: number, userId: number): Task | undefined {
    const task = this.db
      .prepare(`SELECT * FROM tasks WHERE id = ? AND user_id = ?`)
      .get(id, userId) as any | undefined;

    if (!task) return undefined;

    return task as Task;
  }

  /**
   * Get all tasks ordered by ID (newest first) for a specific user
   * @param userId - User ID
   * @returns Array of all tasks
   */
  public getAllTasks(userId: number): Task[] {
    const tasks = this.db
      .prepare(`SELECT * FROM tasks WHERE user_id = ? ORDER BY id DESC`)
      .all(userId) as any[];

    return tasks.map((task) => task as Task);
  }

  /**
   * Get tasks filtered by status and/or project for a specific user
   * @param filter - Filter criteria
   * @returns Array of filtered tasks
   */
  public getTasksByFilter(filter: {
    status?: string;
    project?: string;
    user_id: number;
  }): Task[] {
    let query = `SELECT * FROM tasks WHERE user_id = ?`;
    const params: any[] = [filter.user_id];

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
   * @param userId - User ID
   * @returns True if task was updated, false otherwise
   */
  public updateTaskStatus(
    id: number,
    status: TASK_STATUS,
    userId: number
  ): boolean {
    const result = this.db
      .prepare(`UPDATE tasks SET status = ? WHERE id = ? AND user_id = ?`)
      .run(status, id, userId);

    return result.changes > 0;
  }

  /**
   * Delete a task by ID
   * @param id - Task ID
   * @param userId - User ID
   * @returns True if task was deleted, false otherwise
   */
  public deleteTask(id: number, userId: number): boolean {
    const result = this.db
      .prepare(`DELETE FROM tasks WHERE id = ? AND user_id = ?`)
      .run(id, userId);

    return result.changes > 0;
  }
}

export default TaskQueries;
