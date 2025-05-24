import { Markup } from "telegraf";
import { GLOBAL_ACTION, PROJECT_ACTION } from "../../types";

/**
 * Creates keyboard for project selection when creating new task
 * @param projects - Array of project names
 * @returns Inline keyboard markup
 */
export function createProjectSelectionKeyboard(projects: string[]) {
  const buttons = projects.map((project) =>
    Markup.button.callback(`📁 ${project}`, `select_project:${project}`)
  );

  // Group buttons by 2 per row
  const rows = [];
  for (let i = 0; i < buttons.length; i += 2) {
    rows.push(buttons.slice(i, i + 2));
  }

  // Add new project creation button
  rows.push([Markup.button.callback(PROJECT_ACTION.NEW, "create_new_project")]);

  return Markup.inlineKeyboard(rows);
}

/**
 * Creates keyboard for project selection from list
 * @param projects - Array of project names
 * @returns Inline keyboard markup
 */
export function createProjectFilterKeyboard(projects: string[]) {
  const buttons = projects.map((project) =>
    Markup.button.callback(`📁 ${project}`, `filter_project:${project}`)
  );

  // Group buttons by 2 per row
  const rows = [];
  for (let i = 0; i < buttons.length; i += 2) {
    rows.push(buttons.slice(i, i + 2));
  }

  // Add "All projects" button
  rows.push([Markup.button.callback("🔍 Все задачи", "show_task_list")]);

  // "Назад" button only on filter screen
  rows.push([Markup.button.callback("◀️ Назад", "show_task_list")]);

  return Markup.inlineKeyboard(rows);
}

/**
 * Creates main project management menu
 * @param projects - Array of project names
 * @returns Inline keyboard markup
 */
export function createProjectManagementKeyboard(projects: string[]) {
  const rows = [];

  if (projects.length > 0) {
    // Buttons for existing projects
    const projectButtons = projects.map((project) =>
      Markup.button.callback(`📁 ${project}`, `manage_project:${project}`)
    );

    // Group buttons by 2 per row
    for (let i = 0; i < projectButtons.length; i += 2) {
      rows.push(projectButtons.slice(i, i + 2));
    }
  }

  rows.push([Markup.button.callback(PROJECT_ACTION.ADD, "add_new_project")]);

  return Markup.inlineKeyboard(rows);
}

/**
 * Creates keyboard for project actions
 * @param project - Project name
 * @returns Inline keyboard markup
 */
export function createProjectActionsKeyboard(project: string) {
  return Markup.inlineKeyboard([
    [Markup.button.callback(GLOBAL_ACTION.CLEAR, `clear_project:${project}`)],
    [Markup.button.callback(GLOBAL_ACTION.DELETE, `delete_project:${project}`)],
    [Markup.button.callback(GLOBAL_ACTION.BACK, "back_to_projects")],
  ]);
}

/**
 * Creates confirmation keyboard for project actions
 * @param action - Action type (clear or delete)
 * @param project - Project name
 * @returns Inline keyboard markup
 */
export function createProjectConfirmationKeyboard(
  action: string,
  project: string
) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(
        GLOBAL_ACTION.CONFIRM,
        `confirm_project_${action}:${project}`
      ),
      Markup.button.callback(
        GLOBAL_ACTION.CANCEL,
        `cancel_project_${action}:${project}`
      ),
    ],
  ]);
}

/**
 * Creates keyboard for confirming multiple tasks creation
 * @param projects - Array of project names
 * @returns Inline keyboard markup
 */
export function createTasksConfirmationKeyboard(projects: string[]) {
  if (projects.length === 0) {
    // If no projects exist, offer to create new one immediately
    return Markup.inlineKeyboard([
      [
        Markup.button.callback(
          PROJECT_ACTION.CREATE,
          "create_new_project_for_tasks"
        ),
      ],
      [
        Markup.button.callback(
          GLOBAL_ACTION.CANCEL_ALL,
          "cancel_tasks_creation"
        ),
      ],
    ]);
  }

  // Buttons for selecting existing project
  const projectButtons = projects.map((project) =>
    Markup.button.callback(
      `📁 ${project}`,
      `select_project_for_tasks:${project}`
    )
  );

  // Group buttons by 2 per row
  const rows = [];
  for (let i = 0; i < projectButtons.length; i += 2) {
    rows.push(projectButtons.slice(i, i + 2));
  }

  // Add management buttons
  rows.push([
    Markup.button.callback(PROJECT_ACTION.NEW, "create_new_project_for_tasks"),
  ]);
  rows.push([
    Markup.button.callback(GLOBAL_ACTION.CANCEL_ALL, "cancel_tasks_creation"),
  ]);

  return Markup.inlineKeyboard(rows);
}
