import { Context, Telegraf } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import dbService from "../../services/database";
import { sessionService } from "../../services";
import {
  createProjectActionsKeyboard,
  createProjectConfirmationKeyboard,
  getKeyboardByScreenState,
  formatTaskList,
  createTaskListHeader,
} from "../../utils";
import { SCREEN_STATE, TASK_STATUS } from "../../types";
import { onNextTextMessage } from "../../services/session";
import { safeAnswerCbQuery } from "./utils";

/**
 * Sets callback handlers for working with projects
 * @param bot - Telegraf bot instance
 */
export function setupProjectCallbacks(bot: Telegraf<Context<Update>>) {
  /**
   * Project management
   */
  bot.action(/^manage_project:(.+)$/, async (ctx) => {
    const project = ctx.match[1];
    const stats = dbService.getProjectStats(project);

    try {
      console.log(
        `Навигация: Пользователь открыл управление проектом "${project}"`
      );

      const projectInfo =
        `📁 Проект: <b>${project}</b>\n\n` +
        `📊 Статистика:\n` +
        `   • Всего задач: ${stats.total}\n` +
        `   • ⏳ Не начато: ${stats.notStarted}\n` +
        `   • 🚧 В работе: ${stats.inProgress}\n` +
        `   • ✅ Сделано: ${stats.done}\n\n` +
        `Выберите действие:`;

      await ctx.editMessageText(projectInfo, {
        parse_mode: "HTML",
        ...createProjectActionsKeyboard(project),
      });

      await safeAnswerCbQuery(ctx);
    } catch (error: any) {
      console.log("Ошибка при управлении проектом:", error.message);
      await safeAnswerCbQuery(ctx, "Ошибка при обработке");
    }
  });

  /**
   * Adding a new project
   */
  bot.action("add_new_project", async (ctx) => {
    if (!ctx.chat) return;

    const chatId = ctx.chat.id;

    try {
      console.log(`Навигация: Пользователь начал создание нового проекта`);

      // Set the state of waiting for the project name
      sessionService.setUserState(chatId, "waiting_for_project_name");

      await ctx.editMessageText(
        "🆕 Создание нового проекта\n\nВведите название проекта:"
      );

      await safeAnswerCbQuery(ctx, "Введите название проекта");
    } catch (error: any) {
      console.log("Ошибка при создании проекта:", error.message);
      await safeAnswerCbQuery(ctx, "Ошибка при обработке");
    }
  });

  /**
   * Clearing the project
   */
  bot.action(/^clear_project:(.+)$/, async (ctx) => {
    const project = ctx.match[1];

    try {
      console.log(
        `Действие: Пользователь запросил очистку проекта "${project}"`
      );

      const confirmMessage =
        `🧹 Очистка проекта "${project}"\n\n` +
        `⚠️ Это действие удалит ВСЕ задачи в проекте!\n` +
        `Проект останется, но задачи будут безвозвратно удалены.\n\n` +
        `Вы уверены?`;

      await ctx.editMessageText(confirmMessage, {
        parse_mode: "HTML",
        ...createProjectConfirmationKeyboard("clear", project),
      });

      await safeAnswerCbQuery(ctx);
    } catch (error: any) {
      console.log("Ошибка при запросе очистки проекта:", error.message);
      await safeAnswerCbQuery(ctx, "Ошибка при обработке");
    }
  });

  /**
   * Deleting the project
   */
  bot.action(/^delete_project:(.+)$/, async (ctx) => {
    const project = ctx.match[1];

    try {
      console.log(
        `Действие: Пользователь запросил удаление проекта "${project}"`
      );

      const confirmMessage = `🗑️ Вы уверены, что хотите удалить проект "${project}"?\n\nВсе задачи этого проекта будут помечены как задачи без проекта.`;

      await ctx.editMessageText(confirmMessage, {
        parse_mode: "HTML",
        ...createProjectConfirmationKeyboard("delete", project),
      });

      await safeAnswerCbQuery(ctx);
    } catch (error: any) {
      console.log("Ошибка при запросе удаления проекта:", error.message);
      await safeAnswerCbQuery(ctx, "Ошибка при обработке запроса");
    }
  });

  /**
   * Confirmation of project clearing
   */
  bot.action(/^confirm_project_clear:(.+)$/, async (ctx) => {
    const project = ctx.match[1];

    try {
      console.log(
        `Действие: Пользователь подтвердил очистку проекта "${project}"`
      );

      const clearedCount = dbService.clearProject(project);

      await ctx.editMessageText(
        `✅ Проект "${project}" очищен.\n` + `Удалено задач: ${clearedCount}`
      );

      await safeAnswerCbQuery(ctx, "Проект очищен");
    } catch (error: any) {
      console.log("Ошибка при очистке проекта:", error.message);
      await safeAnswerCbQuery(ctx, "Ошибка при очистке");
    }
  });

  /**
   * Confirmation of project deletion
   */
  bot.action(/^confirm_project_delete:(.+)$/, async (ctx) => {
    const project = ctx.match[1];

    try {
      console.log(
        `Действие: Пользователь подтвердил удаление проекта "${project}"`
      );

      const success = dbService.deleteProject(project);

      if (success) {
        const projects = dbService.getProjects();

        let text;
        if (projects.length === 0) {
          text =
            "📁 У вас пока нет проектов.\n\nНажмите кнопку ниже, чтобы создать первый проект:";
        } else {
          let projectsInfo = "📁 Управление проектами:\n\n";
          projects.forEach((project) => {
            const stats = dbService.getProjectStats(project);
            projectsInfo += `📂 <b>${project}</b>\n`;
            projectsInfo += `   📊 Всего: ${stats.total} | ⏳ ${stats.notStarted} | 🚧 ${stats.inProgress} | ✅ ${stats.done}\n\n`;
          });
          text = projectsInfo;
        }

        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          ...getKeyboardByScreenState([], SCREEN_STATE.PROJECT_MANAGEMENT, {
            projects,
          }),
        });

        await safeAnswerCbQuery(ctx, `Проект "${project}" удален`);
      } else {
        await ctx.editMessageText(`❌ Не удалось удалить проект "${project}"`);
        await safeAnswerCbQuery(ctx, "Ошибка при удалении");
      }
    } catch (error: any) {
      console.log("Ошибка при удалении проекта:", error.message);
      await ctx.editMessageText("❌ Ошибка при удалении проекта");
      await safeAnswerCbQuery(ctx, "Ошибка при удалении");
    }
  });

  /**
   * Cancellation of project clearing
   */
  bot.action(/^cancel_project_clear:(.+)$/, async (ctx) => {
    const project = ctx.match[1];

    try {
      console.log(
        `Действие: Пользователь отменил очистку проекта "${project}"`
      );

      const stats = dbService.getProjectStats(project);
      const projectInfo =
        `📁 Проект: <b>${project}</b>\n\n` +
        `📊 Статистика:\n` +
        `   • Всего задач: ${stats.total}\n` +
        `   • ⏳ Не начато: ${stats.notStarted}\n` +
        `   • 🚧 В работе: ${stats.inProgress}\n` +
        `   • ✅ Сделано: ${stats.done}\n\n` +
        `Выберите действие:`;

      await ctx.editMessageText(projectInfo, {
        parse_mode: "HTML",
        ...createProjectActionsKeyboard(project),
      });

      await safeAnswerCbQuery(ctx, "Очистка отменена");
    } catch (error: any) {
      console.log("Ошибка при отмене очистки:", error.message);
      await safeAnswerCbQuery(ctx, "Ошибка");
    }
  });

  /**
   * Cancellation of project deletion
   */
  bot.action(/^cancel_project_delete:(.+)$/, async (ctx) => {
    const project = ctx.match[1];

    try {
      console.log(
        `Действие: Пользователь отменил удаление проекта "${project}"`
      );

      const stats = dbService.getProjectStats(project);
      const projectInfo =
        `📁 Проект: <b>${project}</b>\n\n` +
        `📊 Статистика:\n` +
        `   • Всего задач: ${stats.total}\n` +
        `   • ⏳ Не начато: ${stats.notStarted}\n` +
        `   • 🚧 В работе: ${stats.inProgress}\n` +
        `   • ✅ Сделано: ${stats.done}\n\n` +
        `Выберите действие:`;

      await ctx.editMessageText(projectInfo, {
        parse_mode: "HTML",
        ...createProjectActionsKeyboard(project),
      });

      await safeAnswerCbQuery(ctx, "Удаление отменено");
    } catch (error: any) {
      console.log("Ошибка при отмене удаления проекта:", error.message);
      await safeAnswerCbQuery(ctx, "Ошибка");
    }
  });

  /**
   * Return to the list of projects
   */
  bot.action("back_to_projects", async (ctx) => {
    try {
      console.log(`Навигация: Пользователь вернулся к списку проектов`);

      const projects = dbService.getProjects();

      if (projects.length === 0) {
        await ctx.editMessageText(
          "📁 У вас пока нет проектов.\n\nНажмите кнопку ниже, чтобы создать первый проект:",
          getKeyboardByScreenState([], SCREEN_STATE.PROJECT_MANAGEMENT, {
            projects,
          })
        );
      } else {
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
      }

      await safeAnswerCbQuery(ctx);
    } catch (error: any) {
      console.log("Ошибка при возврате к проектам:", error.message);
      await safeAnswerCbQuery(ctx, "Ошибка при обработке");
    }
  });

  /**
   * Create a new project
   */
  bot.action("create_project", async (ctx) => {
    try {
      console.log(`Навигация: Пользователь начал создание нового проекта`);

      await ctx.editMessageText(
        `📁 Создание нового проекта\n\nОтправьте название проекта в следующем сообщении:`,
        getKeyboardByScreenState([], SCREEN_STATE.PROJECT_MANAGEMENT)
      );
      await safeAnswerCbQuery(ctx);

      // Register a one-time event handler for the next text message
      const userId = ctx.from?.id;
      if (userId) {
        onNextTextMessage(userId, async (context: Context, text: string) => {
          try {
            const projectName = text.trim();
            console.log(
              `Действие: Пользователь создал проект "${projectName}"`
            );

            if (projectName.length === 0) {
              await context.reply(
                "⚠️ Название проекта не может быть пустым. Попробуйте еще раз."
              );
              return;
            }

            // Check if the project already exists
            const projects = dbService.getProjects();
            if (projects.includes(projectName)) {
              await context.reply(
                `⚠️ Проект "${projectName}" уже существует. Попробуйте другое название.`
              );
              return;
            }

            // Используем addProject вместо createProject
            dbService.addProject(projectName);

            await context.reply(
              `✅ Проект "${projectName}" успешно создан!\n\n<b>Что дальше?</b>\n• Добавляйте задачи и назначайте их в этот проект\n• Используйте фильтр по проектам для просмотра задач проекта`,
              {
                parse_mode: "HTML",
                ...getKeyboardByScreenState([], SCREEN_STATE.MAIN_LIST),
              }
            );
          } catch (error) {
            console.log("Ошибка при создании проекта:", error);
            await context.reply(
              "Произошла ошибка при создании проекта. Попробуйте позже."
            );
          }
        });
      }
    } catch (error) {
      console.log("Ошибка при создании проекта:", error);
      await safeAnswerCbQuery(ctx, "Ошибка при создании проекта");
    }
  });

  /**
   * Show tasks for a project
   */
  bot.action(/^project_tasks:(.+)$/, async (ctx) => {
    const project = ctx.match[1];

    try {
      console.log(
        `Навигация: Пользователь открыл список задач проекта "${project}"`
      );

      const tasks = dbService.getTasksByFilter({ project });
      const activeTasks = tasks.filter(
        (task) => task.status !== TASK_STATUS.DONE
      );

      if (tasks.length === 0) {
        await ctx.editMessageText(
          `📁 Проект "${project}"\n\nВ этом проекте пока нет задач. Создайте новую задачу и выберите этот проект при создании.`,
          getKeyboardByScreenState([], SCREEN_STATE.PROJECT_MANAGEMENT)
        );
        await safeAnswerCbQuery(ctx, "Проект пуст");
        return;
      }

      const header = createTaskListHeader({ project });
      const taskListText = header + "\n\n" + formatTaskList(tasks, false);

      await ctx.editMessageText(taskListText, {
        parse_mode: "HTML",
        ...getKeyboardByScreenState(
          activeTasks,
          SCREEN_STATE.FILTERED_BY_PROJECT,
          {
            project,
          }
        ),
      });

      await safeAnswerCbQuery(ctx, `Задачи проекта "${project}"`);
    } catch (error: any) {
      console.log("Ошибка при показе задач проекта:", error.message);
      await safeAnswerCbQuery(ctx, "Ошибка при получении задач");
    }
  });
}
