import { TASK_STATUS, TASK_STATUS_EMOJI, TASK_STATUS_TITLE } from "../../types";

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
