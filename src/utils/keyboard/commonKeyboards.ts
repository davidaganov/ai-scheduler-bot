import { Markup } from "telegraf";
import {
  GLOBAL_ACTION,
  NAVIGATION_TITLE,
  TASK_STATUS,
  TASK_STATUS_TITLE,
  TASK_STATUS_EMOJI,
} from "../../types";

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
 * Creates keyboard with status filter buttons
 * @returns Inline keyboard markup
 */
export function createStatusButtonsKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(
        `${TASK_STATUS_EMOJI.NOT_STARTED} ${TASK_STATUS_TITLE.NOT_STARTED}`,
        `filter_status:${TASK_STATUS.NOT_STARTED}`
      ),
    ],
    [
      Markup.button.callback(
        `${TASK_STATUS_EMOJI.IN_PROGRESS} ${TASK_STATUS_TITLE.IN_PROGRESS}`,
        `filter_status:${TASK_STATUS.IN_PROGRESS}`
      ),
    ],
    [
      Markup.button.callback(
        `${TASK_STATUS_EMOJI.DONE} ${TASK_STATUS_TITLE.DONE}`,
        `filter_status:${TASK_STATUS.DONE}`
      ),
    ],
    [Markup.button.callback(NAVIGATION_TITLE.TASK_LIST, `filter_status:all`)],
    [Markup.button.callback(NAVIGATION_TITLE.BACK, "show_task_list")],
  ]);
}
