import { Context, Telegraf } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import dbService from "../services/database";
import { getKeyboardByScreenState } from "../utils";
import { TASK_STATUS, TASK_STATUS_EMOJI, SCREEN_STATE } from "../types";

/**
 * Sets up command handlers for the bot
 * @param bot - Telegraf bot instance
 */
export function setupCommandHandlers(bot: Telegraf<Context<Update>>) {
  /**
   * /start command - greeting and instructions
   */
  bot.start((ctx) => {
    ctx.reply(
      "👋 Привет! Я бот для управления задачами.\n\n" +
        "📝 Перешли мне сообщения от заказчика, и я создам из них задачи.\n\n" +
        "Основные команды:\n" +
        "/tasks - показать активные задачи\n" +
        "/projects - управление проектами\n" +
        "/help - показать справку"
    );
  });

  /**
   * /help command - help information
   */
  bot.help((ctx) => {
    ctx.reply(
      "🔍 Доступные команды:\n\n" +
        "/tasks - управление задачами\n" +
        "/projects - управление проектами \n\n"
    );
  });

  /**
   * /tasks command - show active tasks (without completed ones)
   */
  bot.command("tasks", (ctx) => {
    const tasks = dbService.getAllTasks();

    // Get statistics by statuses
    const notStarted = tasks.filter(
      (task) => task.status === TASK_STATUS.NOT_STARTED
    ).length;
    const inProgress = tasks.filter(
      (task) => task.status === TASK_STATUS.IN_PROGRESS
    ).length;
    const done = tasks.filter(
      (task) => task.status === TASK_STATUS.DONE
    ).length;

    const text =
      `📋 Список задач • Статусы\n\n` +
      `${TASK_STATUS_EMOJI.NOT_STARTED} Не начато: ${notStarted}\n` +
      `${TASK_STATUS_EMOJI.IN_PROGRESS} В работе: ${inProgress}\n` +
      `${TASK_STATUS_EMOJI.DONE} Сделано: ${done}\n\n` +
      `Всего задач: ${tasks.length}`;

    ctx.reply(text, {
      parse_mode: "HTML",
      ...getKeyboardByScreenState(tasks, SCREEN_STATE.STATUS_SELECTION),
    });
  });

  /**
   * /projects command - project management
   */
  bot.command("projects", (ctx) => {
    const projects = dbService.getProjects();

    if (projects.length === 0) {
      return ctx.reply(
        "📁 У вас пока нет проектов.\n\nНажмите кнопку ниже, чтобы создать первый проект:",
        getKeyboardByScreenState([], SCREEN_STATE.PROJECT_MANAGEMENT, {
          projects,
        })
      );
    }

    let projectsInfo = "📁 Управление проектами:\n\n";

    projects.forEach((project: string) => {
      const stats = dbService.getProjectStats(project);
      projectsInfo += `📂 <b>${project}</b>\n`;
      projectsInfo += `   📊 Всего: ${stats.total} | ⏳ ${stats.notStarted} | 🚧 ${stats.inProgress} | ✅ ${stats.done}\n\n`;
    });

    ctx.reply(projectsInfo, {
      parse_mode: "HTML",
      ...getKeyboardByScreenState([], SCREEN_STATE.PROJECT_MANAGEMENT, {
        projects,
      }),
    });
  });
}
