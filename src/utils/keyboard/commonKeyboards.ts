import { Markup } from "telegraf";
import { GLOBAL_ACTION, TASK_STATUS } from "../../types";

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
        "🆕 Не начато",
        `filter_status:${TASK_STATUS.NOT_STARTED}`
      ),
    ],
    [
      Markup.button.callback(
        "🚧 В работе",
        `filter_status:${TASK_STATUS.IN_PROGRESS}`
      ),
    ],
    [Markup.button.callback("✅ Сделано", `filter_status:${TASK_STATUS.DONE}`)],
    [Markup.button.callback("🔍 Все задачи", `filter_status:all`)],
    [Markup.button.callback("◀️ Назад", "show_task_list")],
  ]);
}
