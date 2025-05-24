import { Markup } from "telegraf";
import {
  TASK_STATUS,
  TASK_STATUS_EMOJI,
  TASK_STATUS_TITLE,
  TASK_ACTION,
  TASKS_FILTER,
  GLOBAL_ACTION,
  PROJECT_ACTION,
  SCREEN_STATE,
} from "../types";

/**
 * Creates keyboard with action buttons for a single task
 * @param taskId - Task ID
 * @param status - Current task status
 * @returns Inline keyboard markup
 */
export function createTaskActionsKeyboard(taskId: number, status: TASK_STATUS) {
  const buttons = [];

  // Add buttons based on current status
  if (status !== TASK_STATUS.IN_PROGRESS) {
    buttons.push(
      Markup.button.callback(TASK_ACTION.START, `start_task:${taskId}`)
    );
  }

  if (status !== TASK_STATUS.DONE) {
    buttons.push(
      Markup.button.callback(TASK_ACTION.DONE, `done_task:${taskId}`)
    );
  }

  buttons.push(
    Markup.button.callback(GLOBAL_ACTION.DELETE, `delete_task:${taskId}`)
  );

  return Markup.inlineKeyboard([buttons]);
}

/**
 * Creates main keyboard for task list
 * @returns Inline keyboard markup
 */
export function createMainTasksKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(TASKS_FILTER.STATUSES, "show_status_filter"),
      Markup.button.callback(TASKS_FILTER.PROJECTS, "show_project_filter"),
    ],
  ]);
}

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
 * Creates keyboard for filtering tasks by status
 * @returns Inline keyboard markup
 */
export function createStatusFilterKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(
        `${TASK_STATUS_EMOJI.NOT_STARTED} ${TASK_STATUS_TITLE.NOT_STARTED}`,
        "filter_status:not_started"
      ),
      Markup.button.callback(
        `${TASK_STATUS_EMOJI.IN_PROGRESS} ${TASK_STATUS_TITLE.IN_PROGRESS}`,
        "filter_status:in_progress"
      ),
    ],
    [
      Markup.button.callback(
        `${TASK_STATUS_EMOJI.DONE} ${TASK_STATUS_TITLE.DONE}`,
        "filter_status:done"
      ),
      Markup.button.callback(TASKS_FILTER.ALL, "filter_status:all"),
    ],
    [
      Markup.button.callback("🔍 Все задачи", "show_task_list"),
      Markup.button.callback("◀️ Назад", "show_task_list"),
    ],
  ]);
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
  rows.push([
    Markup.button.callback(TASKS_FILTER.PROJECTS, "filter_project:all"),
  ]);

  // "Назад" button only on filter screen
  rows.push([Markup.button.callback("◀️ Назад", "show_task_list")]);

  return Markup.inlineKeyboard(rows);
}

/**
 * Creates confirmation keyboard for actions
 * @param action - Action type
 * @param id - Item ID
 * @returns Inline keyboard markup
 */
export function createConfirmationKeyboard(action: string, id: number) {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(GLOBAL_ACTION.CONFIRM, `confirm_${action}:${id}`),
      Markup.button.callback(GLOBAL_ACTION.CANCEL, `cancel_${action}:${id}`),
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

/**
 * Creates keyboard for task list with info buttons
 * @param tasks - Array of tasks
 * @returns Inline keyboard markup
 */
export function createTaskListKeyboard(tasks: any[]) {
  // Filter tasks with valid id
  const validTasks = tasks.filter((task) => task.id != null);
  const rows = [];

  // Create callback buttons for each task
  for (const task of validTasks) {
    rows.push([
      Markup.button.callback(`🔗 Задача #${task.id}`, `task_info:${task.id}`),
    ]);
  }

  // Add buttons at the bottom
  rows.push([Markup.button.callback("📊 Статусы", "show_statuses_screen")]);

  rows.push([Markup.button.callback("📁 Проекты", "show_project_filter")]);

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
 * Creates keyboard for status filter buttons (main screen)
 * @returns Inline keyboard markup
 */
export function createStatusButtonsKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(
        `${TASK_STATUS_EMOJI.NOT_STARTED} Не начато`,
        "filter_status:not_started"
      ),
    ],
    [
      Markup.button.callback(
        `${TASK_STATUS_EMOJI.IN_PROGRESS} В работе`,
        "filter_status:in_progress"
      ),
    ],
    [
      Markup.button.callback(
        `${TASK_STATUS_EMOJI.DONE} Сделано`,
        "filter_status:done"
      ),
    ],
    [
      Markup.button.callback(`🔍 Все задачи`, "filter_status:all"),
      Markup.button.callback(`◀️ Назад`, "show_task_list"),
    ],
  ]);
}

/**
 * Creates keyboard for tasks filtered by status
 * @param tasks - Array of tasks
 * @returns Inline keyboard markup
 */
export function createFilteredByStatusKeyboard(tasks: any[]) {
  // Filter tasks with valid id
  const validTasks = tasks.filter((task) => task.id != null);
  const rows = [];

  // Create callback buttons for each task
  for (const task of validTasks) {
    rows.push([
      Markup.button.callback(`🔗 Задача #${task.id}`, `task_info:${task.id}`),
    ]);
  }

  // For status-filtered screen, only back/all tasks buttons
  rows.push([
    Markup.button.callback("🔍 Все задачи", "show_task_list"),
    Markup.button.callback("◀️ Назад", "show_task_list"),
  ]);

  return Markup.inlineKeyboard(rows);
}

/**
 * Creates keyboard for tasks filtered by project
 * @param tasks - Array of tasks
 * @returns Inline keyboard markup
 */
export function createFilteredByProjectKeyboard(tasks: any[]) {
  // Filter tasks with valid id
  const validTasks = tasks.filter((task) => task.id != null);
  const rows = [];

  // Create callback buttons for each task
  for (const task of validTasks) {
    rows.push([
      Markup.button.callback(`🔗 Задача #${task.id}`, `task_info:${task.id}`),
    ]);
  }

  // For project-filtered screen, show "All tasks" and "Back" buttons
  rows.push([
    Markup.button.callback("🔍 Все задачи", "show_task_list"),
    Markup.button.callback("◀️ Назад", "show_task_list"),
  ]);

  return Markup.inlineKeyboard(rows);
}

/**
 * Get the appropriate keyboard based on the screen state
 * @param tasks - Array of tasks
 * @param screenState - Current screen state
 * @param additionalData - Additional data needed for some keyboards (e.g. projects list)
 * @returns Inline keyboard markup
 */
export function getKeyboardByScreenState(
  tasks: any[],
  screenState: SCREEN_STATE,
  additionalData?: any
) {
  const filteredTasks = tasks.filter(
    (task) => task.status !== TASK_STATUS.DONE
  );

  console.log(screenState);

  switch (screenState) {
    case SCREEN_STATE.MAIN_LIST:
      return createTaskListKeyboard(filteredTasks);

    case SCREEN_STATE.FILTERED_BY_STATUS:
      return createFilteredByStatusKeyboard(filteredTasks);

    case SCREEN_STATE.FILTERED_BY_PROJECT:
      return createFilteredByProjectKeyboard(filteredTasks);

    case SCREEN_STATE.STATUS_SELECTION:
      return createStatusButtonsKeyboard();

    case SCREEN_STATE.PROJECT_SELECTION:
      return createProjectFilterKeyboard(additionalData?.projects || []);

    case SCREEN_STATE.PROJECT_MANAGEMENT:
      return createProjectManagementKeyboard(additionalData?.projects || []);

    case SCREEN_STATE.TASK_DETAILS:
      const taskId = additionalData?.taskId;
      const status = additionalData?.status || TASK_STATUS.NOT_STARTED;
      return createTaskActionsKeyboard(taskId, status);

    default:
      return createTaskListKeyboard(filteredTasks);
  }
}
