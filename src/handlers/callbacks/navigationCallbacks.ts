import { Context, Telegraf } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import dbService from "../../services/database";
import {
  getKeyboardByScreenState,
  formatTaskList,
  createTaskListHeader,
} from "../../utils";
import { SCREEN_STATE, TASK_STATUS } from "../../types";
import { safeAnswerCbQuery } from "./utils";

/**
 * Sets callback handlers for navigation through the bot sections
 * @param bot - Telegraf bot instance
 */
export function setupNavigationCallbacks(bot: Telegraf<Context<Update>>) {
  /**
   * Main menu with a list of tasks
   */
  bot.action("show_main_menu", async (ctx) => {
    try {
      console.log(`Навигация: Пользователь открыл главное меню`);

      const tasks = dbService.getAllTasks();
      const filteredTasks = tasks.filter(
        (task) => task.status !== TASK_STATUS.DONE
      );

      // If there are no tasks, show an empty list
      if (tasks.length === 0) {
        await ctx.editMessageText(
          "📋 Список задач пуст\n\nСоздайте новую задачу, отправив мне сообщение с её описанием.",
          getKeyboardByScreenState([], SCREEN_STATE.MAIN_LIST)
        );
        await safeAnswerCbQuery(ctx);
        return;
      }

      const taskListText =
        createTaskListHeader() + "\n\n" + formatTaskList(tasks, false);

      await ctx.editMessageText(taskListText, {
        parse_mode: "HTML",
        ...getKeyboardByScreenState(filteredTasks, SCREEN_STATE.MAIN_LIST),
      });

      await safeAnswerCbQuery(ctx);
    } catch (error) {
      console.log("Ошибка при показе главного меню:", error);
      await safeAnswerCbQuery(ctx, "Ошибка при показе задач");
    }
  });

  /**
   * Project management section
   */
  bot.action("show_projects", async (ctx) => {
    try {
      console.log(`Навигация: Пользователь открыл раздел проектов`);

      const projects = dbService.getProjects();

      if (projects.length === 0) {
        await ctx.editMessageText(
          "📁 У вас пока нет проектов.\n\nНажмите кнопку ниже, чтобы создать первый проект:",
          getKeyboardByScreenState([], SCREEN_STATE.PROJECT_MANAGEMENT, {
            projects,
          })
        );

        await safeAnswerCbQuery(ctx, "Проекты");
        return;
      }

      let projectsInfo = "📁 Управление проектами:\n\n";

      projects.forEach((project) => {
        const stats = dbService.getProjectStats(project);
        projectsInfo += `📂 <b>${project}</b>\n`;
        projectsInfo += `   📊 Всего: ${stats.total} | ⏳ ${stats.notStarted} | 🚧 ${stats.inProgress} | ✅ ${stats.done}\n\n`;
      });

      await ctx.editMessageText(projectsInfo, {
        parse_mode: "HTML",
        ...getKeyboardByScreenState([], SCREEN_STATE.PROJECT_MANAGEMENT, {
          projects,
        }),
      });

      await safeAnswerCbQuery(ctx, "Проекты");
    } catch (error) {
      console.log("Ошибка при показе проектов:", error);
      await safeAnswerCbQuery(ctx, "Ошибка при показе проектов");
    }
  });

  /**
   * Information about the bot
   */
  bot.action("show_help", async (ctx) => {
    try {
      console.log(`Навигация: Пользователь открыл справку`);

      const helpText = `
<b>📱 AI Scheduler Bot</b>

Этот бот поможет управлять задачами, организовывать их по проектам и отслеживать статус выполнения.

<b>Основные команды:</b>
• /start - Начать работу с ботом
• /list - Показать список задач
• /projects - Управление проектами

<b>Создание задач:</b>
• Просто отправьте сообщение с описанием задачи
• Можно отправить несколько сообщений подряд, бот объединит их в задачи

<b>Основные возможности:</b>
• Создание задач из сообщений
• Организация задач по проектам
• Отслеживание статуса выполнения
• Фильтрация и поиск

<b>Управление задачами:</b>
• Нажмите на задачу для управления ею
• Меняйте статус (не начато, в работе, сделано)
• Удаляйте задачи

<b>Проекты:</b>
• Создавайте проекты для группировки задач
• Просматривайте статистику по проектам
• Управляйте задачами в рамках проекта

<b>Версия:</b> 1.0.0
`;

      await ctx.editMessageText(helpText, {
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
        ...getKeyboardByScreenState([], SCREEN_STATE.MAIN_LIST),
      });

      await safeAnswerCbQuery(ctx, "Справка");
    } catch (error) {
      console.log("Ошибка при показе справки:", error);
      await safeAnswerCbQuery(ctx, "Ошибка при показе справки");
    }
  });
}
