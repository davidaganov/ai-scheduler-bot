import TaskQueries from "./taskQueries";
import ProjectQueries from "./projectQueries";

/**
 * Combined service for working with the database
 * Includes methods for working with tasks and projects
 */
class DatabaseService extends TaskQueries {
  private projectQueries: ProjectQueries;

  constructor() {
    super();
    this.projectQueries = new ProjectQueries();
  }

  // Delegation of methods from ProjectQueries
  public getProjects(userId: number): string[] {
    return this.projectQueries.getProjects(userId);
  }

  public addProject(projectName: string, userId: number): boolean {
    return this.projectQueries.addProject(projectName, userId);
  }

  public clearProject(projectName: string, userId: number): boolean {
    return this.projectQueries.clearProject(projectName, userId);
  }

  public deleteProject(projectName: string, userId: number): boolean {
    return this.projectQueries.deleteProject(projectName, userId);
  }

  public getProjectStats(
    projectName: string,
    userId: number
  ): {
    total: number;
    notStarted: number;
    inProgress: number;
    done: number;
  } {
    return this.projectQueries.getProjectStats(projectName, userId);
  }

  public projectExists(projectName: string, userId: number): boolean {
    return this.projectQueries.projectExists(projectName, userId);
  }
}

// Exporting the single instance of the service
export default new DatabaseService();
