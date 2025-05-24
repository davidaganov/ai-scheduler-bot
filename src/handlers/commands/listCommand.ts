import { Context, Telegraf } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import dbService from "../../services/database";
import {
  formatTaskList,
  createTaskListHeader,
  getKeyboardByScreenState,
} from "../../utils";
import { SCREEN_STATE, TASK_STATUS } from "../../types";

/**
 * Sets the handler for the /list command
 * @param bot - Telegraf bot instance
 */
export function setupListCommand(bot: Telegraf<Context<Update>>) {
  bot.command("list", async (ctx) => {
    try {
      const tasks = dbService.getAllTasks();

      if (tasks.length === 0) {
        await ctx.reply(
          "📋 Список задач пуст\n\nСоздайте новую задачу, отправив мне сообщение с её описанием.",
          getKeyboardByScreenState([], SCREEN_STATE.MAIN_LIST)
        );
        return;
      }

      // Filter tasks, excluding completed for the keyboard
      const filteredTasks = tasks.filter(
        (task) => task.status !== TASK_STATUS.DONE
      );

      // Form the text of the task list
      const taskListText =
        createTaskListHeader() + "\n\n" + formatTaskList(tasks, false);

      await ctx.replyWithHTML(
        taskListText,
        getKeyboardByScreenState(filteredTasks, SCREEN_STATE.MAIN_LIST)
      );
    } catch (error) {
      console.log("Ошибка при обработке команды /list:", error);
      await ctx.reply(
        "Произошла ошибка при получении списка задач. Попробуйте позже."
      );
    }
  });
}
