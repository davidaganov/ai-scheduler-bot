import { Task, TASK_STATUS } from "../../types";
import { formatStatus, formatStatusEmoji } from "./statusFormatters";
import { formatDate } from "./dateFormatters";

/**
 * Formats a single task for display
 * @param task - Task object
 * @returns Formatted task string
 */
export function formatTask(task: Task): string {
  let result = `📌 ${task.description}
📁 ${task.project}
${formatStatus(task.status)}
📅 ${formatDate(task.created_at)}`;

  return result;
}

/**
 * Formats task list for display with buttons
 * @param tasks - Array of tasks
 * @param showCompleted - Whether to show completed tasks
 * @returns Formatted task list string
 */
export function formatTaskList(
  tasks: Task[],
  showCompleted: boolean = false
): string {
  if (tasks.length === 0) {
    return "Задачи не найдены";
  }

  // Filter tasks by default (hide completed)
  const filteredTasks = showCompleted
    ? tasks
    : tasks.filter((task) => task.status !== TASK_STATUS.DONE);

  if (filteredTasks.length === 0) {
    return showCompleted ? "Задачи не найдены" : "Нет активных задач";
  }

  const messages = filteredTasks.map(
    (task, index) =>
      `${index + 1}. [${formatStatusEmoji(task.status)}] ${task.description}`
  );

  // Add empty lines between tasks
  return messages.join("\n\n").slice(0, 4000);
}

/**
 * Creates header for task list
 * @param filter - Optional filter criteria
 * @returns Header string for task list
 */
export function createTaskListHeader(filter?: {
  status?: TASK_STATUS;
  project?: string;
}): string {
  let header = "📋 Список задач";

  if (filter?.status) {
    header += ` • ${formatStatus(filter.status)}`;
  }

  if (filter?.project) {
    header += ` • Проект: ${filter.project}`;
  }

  return header;
}
