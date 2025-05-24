import {
  type Task,
  TASK_STATUS,
  TASK_STATUS_EMOJI,
  TASK_STATUS_TITLE,
  LOCALE,
} from "../types";

/**
 * Formats task status as emoji only
 * @param status - Task status string
 * @returns Emoji representing the status
 */
export function formatStatusEmoji(status: TASK_STATUS): TASK_STATUS_EMOJI {
  switch (status) {
    case TASK_STATUS.NOT_STARTED:
      return TASK_STATUS_EMOJI.NOT_STARTED;
    case TASK_STATUS.IN_PROGRESS:
      return TASK_STATUS_EMOJI.IN_PROGRESS;
    case TASK_STATUS.DONE:
      return TASK_STATUS_EMOJI.DONE;
    default:
      return TASK_STATUS_EMOJI.UNDEFINED;
  }
}

/**
 * Formats task status into human-readable form with emoji
 * @param status - Task status string
 * @returns Formatted status string with emoji for user display
 */
export function formatStatus(status: TASK_STATUS): string {
  switch (status) {
    case TASK_STATUS.NOT_STARTED:
      return `${TASK_STATUS_EMOJI.NOT_STARTED} ${TASK_STATUS_TITLE.NOT_STARTED}`;
    case TASK_STATUS.IN_PROGRESS:
      return `${TASK_STATUS_EMOJI.IN_PROGRESS} ${TASK_STATUS_TITLE.IN_PROGRESS}`;
    case TASK_STATUS.DONE:
      return `${TASK_STATUS_EMOJI.DONE} ${TASK_STATUS_TITLE.DONE}`;
    default:
      return `${TASK_STATUS_EMOJI.UNDEFINED} ${TASK_STATUS_TITLE.UNDEFINED}`;
  }
}

/**
 * Formats date in local format
 * @param isoDate - ISO date string
 * @returns Formatted date string
 */
export function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString(LOCALE.RU);
  } catch (e) {
    return isoDate.split("T")[0];
  }
}

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
