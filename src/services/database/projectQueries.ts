import DatabaseService from "./databaseService";

/**
 * Class for working with projects in the database
 */
class ProjectQueries extends DatabaseService {
  /**
   * Get all project names from both projects table and tasks for a specific user
   * @param userId - User ID
   * @returns Sorted array of unique project names
   */
  public getProjects(userId: number): string[] {
    // Get projects from dedicated table + projects with tasks
    const projectsFromTable = this.db
      .prepare(`SELECT name FROM projects WHERE user_id = ? ORDER BY name`)
      .all(userId)
      .map((row: any) => row.name);

    const projectsFromTasks = this.db
      .prepare(
        `SELECT DISTINCT project FROM tasks WHERE user_id = ? ORDER BY project`
      )
      .all(userId)
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
   * @param userId - User ID
   * @returns True if project was added, false if it already exists
   */
  public addProject(projectName: string, userId: number): boolean {
    try {
      const result = this.db
        .prepare(
          `
        INSERT INTO projects (name, created_at, user_id)
        VALUES (?, ?, ?)
      `
        )
        .run(projectName, new Date().toISOString(), userId);

      return result.changes > 0;
    } catch (error) {
      // Project already exists
      return false;
    }
  }

  /**
   * Delete all tasks from a project
   * @param projectName - Name of the project
   * @param userId - User ID
   * @returns True if tasks were deleted, false otherwise
   */
  public clearProject(projectName: string, userId: number): boolean {
    const result = this.db
      .prepare(`DELETE FROM tasks WHERE project = ? AND user_id = ?`)
      .run(projectName, userId);

    return result.changes > 0;
  }

  /**
   * Delete a project and all its tasks
   * @param projectName - Name of the project
   * @param userId - User ID
   * @returns True if project or tasks were deleted, false otherwise
   */
  public deleteProject(projectName: string, userId: number): boolean {
    // Delete project from projects table
    const projectResult = this.db
      .prepare(`DELETE FROM projects WHERE name = ? AND user_id = ?`)
      .run(projectName, userId);

    // Delete all tasks of this project
    const tasksResult = this.db
      .prepare(`DELETE FROM tasks WHERE project = ? AND user_id = ?`)
      .run(projectName, userId);

    return projectResult.changes > 0 || tasksResult.changes > 0;
  }

  /**
   * Get statistics for a specific project
   * @param projectName - Name of the project
   * @param userId - User ID
   * @returns Object with task counts by status
   */
  public getProjectStats(
    projectName: string,
    userId: number
  ): {
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
      WHERE project = ? AND user_id = ?
    `
      )
      .get(projectName, userId) as any;

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
   * @param userId - User ID
   * @returns True if project exists, false otherwise
   */
  public projectExists(projectName: string, userId: number): boolean {
    const project = this.db
      .prepare(`SELECT 1 FROM projects WHERE name = ? AND user_id = ? LIMIT 1`)
      .get(projectName, userId);

    return !!project;
  }
}

export default ProjectQueries;
