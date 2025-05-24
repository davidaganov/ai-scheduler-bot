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
import {
  SCREEN_STATE,
  TASK_STATUS,
  NAVIGATION_ACTION,
  TASK_STATUS_EMOJI,
  TASK_STATUS_TITLE,
} from "../../types";
import { onNextTextMessage } from "../../services/session";
import { safeAnswerCbQuery } from "./utils";

/**
 * Sets callback handlers for working with projects
 * @param bot - Telegraf bot instance
 */
export function setupProjectCallbacks(bot: Telegraf<Context<Update>>) {
  // Вспомогательные функции
  const logAction = (action: string, project?: string) => {
    const message = project ? `${action}: "${project}"` : action;
    console.log(message);
  };

  const handleError = async (
    ctx: Context,
    errorMsg: string,
    error: any,
    callbackMsg: string = "Ошибка при обработке"
  ) => {
    console.log(errorMsg, error?.message || error);
    await safeAnswerCbQuery(ctx, callbackMsg);
  };

  const renderProjectInfo = (project: string, userId: number) => {
    const stats = dbService.getProjectStats(project, userId);
    return (
      `📁 Проект: <b>${project}</b>\n\n` +
      `📊 Статистика:\n` +
      `   • Всего задач: ${stats.total}\n` +
      `   • ${TASK_STATUS_EMOJI.NOT_STARTED} ${TASK_STATUS_TITLE.NOT_STARTED}: ${stats.notStarted}\n` +
      `   • ${TASK_STATUS_EMOJI.IN_PROGRESS} ${TASK_STATUS_TITLE.IN_PROGRESS}: ${stats.inProgress}\n` +
      `   • ${TASK_STATUS_EMOJI.DONE} ${TASK_STATUS_TITLE.DONE}: ${stats.done}\n\n` +
      `Выберите действие:`
    );
  };

  const renderProjectsList = (userId: number) => {
    const projects = dbService.getProjects(userId);

    if (projects.length === 0) {
      return {
        text: "📁 У вас пока нет проектов.\n\nНажмите кнопку ниже, чтобы создать первый проект:",
        keyboard: getKeyboardByScreenState(
          [],
          SCREEN_STATE.PROJECT_MANAGEMENT,
          { projects }
        ),
      };
    }

    let projectsInfo = "📁 Управление проектами:\n\n";
    projects.forEach((project) => {
      const stats = dbService.getProjectStats(project, userId);
      projectsInfo += `📂 <b>${project}</b>\n`;
      projectsInfo += `   📊 Всего: ${stats.total} | ⏳ ${stats.notStarted} | 🚧 ${stats.inProgress} | ✅ ${stats.done}\n\n`;
    });

    return {
      text: projectsInfo,
      keyboard: getKeyboardByScreenState([], SCREEN_STATE.PROJECT_MANAGEMENT, {
        projects,
      }),
    };
  };

  /**
   * Project management
   */
  bot.action(/^manage_project:(.+)$/, async (ctx) => {
    const project = ctx.match[1];
    if (!ctx.from) return;
    const userId = ctx.from.id;

    try {
      logAction("Навигация: Пользователь открыл управление проектом", project);

      await ctx.editMessageText(renderProjectInfo(project, userId), {
        parse_mode: "HTML",
        ...createProjectActionsKeyboard(project),
      });

      await safeAnswerCbQuery(ctx);
    } catch (error: any) {
      await handleError(ctx, "Ошибка при управлении проектом:", error);
    }
  });

  /**
   * Adding a new project
   */
  bot.action("add_new_project", async (ctx) => {
    if (!ctx.chat) return;

    try {
      logAction("Навигация: Пользователь начал создание нового проекта");

      sessionService.setUserState(ctx.chat.id, "waiting_for_project_name");

      await ctx.editMessageText(
        "🆕 Создание нового проекта\n\nВведите название проекта:"
      );
      await safeAnswerCbQuery(ctx, "Введите название проекта");
    } catch (error: any) {
      await handleError(ctx, "Ошибка при создании проекта:", error);
    }
  });

  /**
   * Confirmation dialogs (delete, clear)
   */
  const setupConfirmationDialog = (
    action: string,
    emoji: string,
    description: string
  ) => {
    bot.action(new RegExp(`^${action}_project:(.+)$`), async (ctx) => {
      const project = ctx.match[1];

      try {
        logAction(`Действие: Пользователь запросил ${action} проекта`, project);

        const confirmMessage = `${emoji} ${description.replace(
          "{project}",
          project
        )}`;

        await ctx.editMessageText(confirmMessage, {
          parse_mode: "HTML",
          ...createProjectConfirmationKeyboard(action, project),
        });

        await safeAnswerCbQuery(ctx);
      } catch (error: any) {
        await handleError(ctx, `Ошибка при запросе ${action} проекта:`, error);
      }
    });
  };

  // Настройка диалогов подтверждения
  setupConfirmationDialog(
    "clear",
    "🧹",
    'Очистка проекта "{project}"\n\n⚠️ Это действие удалит ВСЕ задачи в проекте!\nПроект останется, но задачи будут безвозвратно удалены.\n\nВы уверены?'
  );
  setupConfirmationDialog(
    "delete",
    "🗑️",
    'Вы уверены, что хотите удалить проект "{project}"?\n\nВсе задачи этого проекта будут помечены как задачи без проекта.'
  );

  /**
   * Confirmation of project clearing
   */
  bot.action(/^confirm_project_clear:(.+)$/, async (ctx) => {
    const project = ctx.match[1];
    if (!ctx.from) return;
    const userId = ctx.from.id;

    try {
      logAction("Действие: Пользователь подтвердил очистку проекта", project);

      const clearedCount = dbService.clearProject(project, userId);
      await ctx.editMessageText(
        `✅ Проект "${project}" очищен.\nУдалено задач: ${clearedCount}`
      );
      await safeAnswerCbQuery(ctx, "Проект очищен");
    } catch (error: any) {
      await handleError(
        ctx,
        "Ошибка при очистке проекта:",
        error,
        "Ошибка при очистке"
      );
    }
  });

  /**
   * Confirmation of project deletion
   */
  bot.action(/^confirm_project_delete:(.+)$/, async (ctx) => {
    const project = ctx.match[1];
    if (!ctx.from) return;
    const userId = ctx.from.id;

    try {
      logAction("Действие: Пользователь подтвердил удаление проекта", project);

      const success = dbService.deleteProject(project, userId);

      if (success) {
        const { text, keyboard } = renderProjectsList(userId);
        await ctx.editMessageText(text, {
          parse_mode: "HTML",
          ...keyboard,
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
   * Cancel operations and return to project info
   */
  const setupCancelAction = (action: string) => {
    bot.action(new RegExp(`^cancel_project_${action}:(.+)$`), async (ctx) => {
      const project = ctx.match[1];
      if (!ctx.from) return;
      const userId = ctx.from.id;

      try {
        logAction(`Действие: Пользователь отменил ${action} проекта`, project);

        await ctx.editMessageText(renderProjectInfo(project, userId), {
          parse_mode: "HTML",
          ...createProjectActionsKeyboard(project),
        });

        await safeAnswerCbQuery(
          ctx,
          `${action === "clear" ? "Очистка" : "Удаление"} отменена`
        );
      } catch (error: any) {
        await handleError(
          ctx,
          `Ошибка при отмене ${action} проекта:`,
          error,
          "Ошибка"
        );
      }
    });
  };

  // Настройка действий отмены
  setupCancelAction("clear");
  setupCancelAction("delete");

  /**
   * Return to the list of projects
   */
  bot.action(NAVIGATION_ACTION.BACK_TO_PROJECTS, async (ctx) => {
    if (!ctx.from) return;
    const userId = ctx.from.id;

    try {
      logAction("Навигация: Пользователь вернулся к списку проектов");

      const { text, keyboard } = renderProjectsList(userId);
      await ctx.editMessageText(text, {
        parse_mode: "HTML",
        ...keyboard,
      });

      await safeAnswerCbQuery(ctx);
    } catch (error: any) {
      await handleError(ctx, "Ошибка при возврате к проектам:", error);
    }
  });

  /**
   * Create a new project
   */
  bot.action(NAVIGATION_ACTION.CREATE_PROJECT, async (ctx) => {
    try {
      logAction("Навигация: Пользователь начал создание нового проекта");

      await ctx.editMessageText(
        "📁 Создание нового проекта\n\nОтправьте название проекта в следующем сообщении:",
        getKeyboardByScreenState([], SCREEN_STATE.PROJECT_MANAGEMENT)
      );
      await safeAnswerCbQuery(ctx);

      const userId = ctx.from?.id;
      if (userId) {
        onNextTextMessage(userId, async (context: Context, text: string) => {
          try {
            const projectName = text.trim();
            const userId = context.from?.id;
            if (!userId) return;

            logAction("Действие: Пользователь создал проект", projectName);

            if (projectName.length === 0) {
              await context.reply(
                "⚠️ Название проекта не может быть пустым. Попробуйте еще раз."
              );
              return;
            }

            const projects = dbService.getProjects(userId);
            if (projects.includes(projectName)) {
              await context.reply(
                `⚠️ Проект "${projectName}" уже существует. Попробуйте другое название.`
              );
              return;
            }

            dbService.addProject(projectName, userId);

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
      await handleError(
        ctx,
        "Ошибка при создании проекта:",
        error,
        "Ошибка при создании проекта"
      );
    }
  });

  /**
   * Show tasks for a project
   */
  bot.action(/^project_tasks:(.+)$/, async (ctx) => {
    const project = ctx.match[1];
    if (!ctx.from) return;
    const userId = ctx.from.id;

    try {
      logAction("Навигация: Пользователь открыл список задач проекта", project);

      const tasks = dbService.getTasksByFilter({ project, user_id: userId });
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
          { project }
        ),
      });

      await safeAnswerCbQuery(ctx, `Задачи проекта "${project}"`);
    } catch (error: any) {
      await handleError(
        ctx,
        "Ошибка при показе задач проекта:",
        error,
        "Ошибка при получении задач"
      );
    }
  });
}
