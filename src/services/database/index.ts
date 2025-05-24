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
  public getProjects(): string[] {
    return this.projectQueries.getProjects();
  }

  public addProject(projectName: string): boolean {
    return this.projectQueries.addProject(projectName);
  }

  public clearProject(projectName: string): boolean {
    return this.projectQueries.clearProject(projectName);
  }

  public deleteProject(projectName: string): boolean {
    return this.projectQueries.deleteProject(projectName);
  }

  public getProjectStats(projectName: string): {
    total: number;
    notStarted: number;
    inProgress: number;
    done: number;
  } {
    return this.projectQueries.getProjectStats(projectName);
  }

  public projectExists(projectName: string): boolean {
    return this.projectQueries.projectExists(projectName);
  }
}

// Exporting the single instance of the service
export default new DatabaseService();
