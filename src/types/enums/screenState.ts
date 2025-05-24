/**
 * Enum for screen states to track user navigation
 */
export enum SCREEN_STATE {
  MAIN_LIST = "main_list", // Main task list
  FILTERED_BY_STATUS = "status_filter", // Tasks filtered by status
  FILTERED_BY_PROJECT = "project_filter", // Tasks filtered by project
  STATUS_SELECTION = "status_selection", // Status selection screen
  PROJECT_SELECTION = "project_selection", // Project selection screen
  PROJECT_MANAGEMENT = "project_management", // Project management screen
  TASK_DETAILS = "task_details", // Task details screen
}
