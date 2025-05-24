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
 * Sets the handler for the /start command
 * @param bot - Telegraf bot instance
 */
export function setupStartCommand(bot: Telegraf<Context<Update>>) {
  bot.start(async (ctx) => {
    try {
      const chatId = ctx.chat.id;
      const firstName = ctx.from?.first_name || "пользователь";

      console.log(`Пользователь ${firstName} (${chatId}) запустил бота`);

      const welcomeMessage = `
Привет, ${firstName}! 👋

Я - <b>AI Scheduler Bot</b>, который поможет тебе управлять задачами и проектами.

Чтобы создать задачу, просто отправь мне сообщение с её описанием.
Например: <i>"Обновить презентацию для клиента"</i>

Также ты можешь переслать мне сообщения из других чатов, и я превращу их в задачи.

<b>Основные команды:</b>
• /list - Показать список задач
• /projects - Управление проектами
• /help - Показать справку
`;

      // Get the list of tasks for the user (if any)
      const tasks = dbService.getAllTasks();
      const filteredTasks = tasks.filter(
        (task) => task.status !== TASK_STATUS.DONE
      );

      // If there are no tasks, show only the welcome message
      if (tasks.length === 0) {
        await ctx.replyWithHTML(
          welcomeMessage,
          getKeyboardByScreenState([], SCREEN_STATE.MAIN_LIST)
        );
        return;
      }

      // Send the welcome message
      await ctx.replyWithHTML(welcomeMessage);

      // Send the list of existing tasks
      const taskListText =
        createTaskListHeader() + "\n\n" + formatTaskList(tasks, false);

      await ctx.replyWithHTML(
        taskListText,
        getKeyboardByScreenState(filteredTasks, SCREEN_STATE.MAIN_LIST)
      );
    } catch (error) {
      console.log("Ошибка при обработке команды /start:", error);
      await ctx.reply("Произошла ошибка при запуске бота. Попробуйте позже.");
    }
  });
}
