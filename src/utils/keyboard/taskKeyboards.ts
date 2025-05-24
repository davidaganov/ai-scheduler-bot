import { Markup } from "telegraf";
import { TASK_STATUS, TASK_ACTION, GLOBAL_ACTION } from "../../types";

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
    Markup.button.callback("📁 Все проекты", "show_project_filter"),
    Markup.button.callback("◀️ Назад", "show_task_list"),
  ]);

  return Markup.inlineKeyboard(rows);
}
