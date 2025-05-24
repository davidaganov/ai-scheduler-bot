import DatabaseService from "./databaseService";

/**
 * Class for working with projects in the database
 */
class ProjectQueries extends DatabaseService {
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

export default ProjectQueries;
