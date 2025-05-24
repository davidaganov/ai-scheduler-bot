import { Context, Telegraf } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import dbService from "../services/database";
import {
  formatTaskList,
  createTaskListHeader,
  createTaskListKeyboard,
  createProjectManagementKeyboard,
} from "../utils";
import type { Task } from "../types";

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

    ctx.reply(
      createTaskListHeader() + "\n\n" + formatTaskList(tasks, false), // false = hide completed tasks
      createTaskListKeyboard(
        tasks.filter((task: Task) => task.status !== "done")
      )
    );
  });

  /**
   * /projects command - project management
   */
  bot.command("projects", (ctx) => {
    const projects = dbService.getProjects();

    if (projects.length === 0) {
      return ctx.reply(
        "📁 У вас пока нет проектов.\n\nНажмите кнопку ниже, чтобы создать первый проект:",
        createProjectManagementKeyboard([])
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
      ...createProjectManagementKeyboard(projects),
    });
  });
}
