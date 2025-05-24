import { Context, Telegraf } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import dbService from "../services/database";
import { createMultipleTasks } from "../handlers";
import { sessionService } from "../services";
import {
  formatTaskList,
  createTaskListHeader,
  formatTask,
  createTaskActionsKeyboard,
  createConfirmationKeyboard,
  createProjectManagementKeyboard,
  createProjectActionsKeyboard,
  createProjectConfirmationKeyboard,
  createStatusButtonsKeyboard,
  getKeyboardByScreenState,
} from "../utils";
import {
  TASK_STATUS,
  TASK_STATUS_EMOJI,
  TASK_STATUS_TITLE,
  SCREEN_STATE,
} from "../types";

/**
 * Safe callback query answer to prevent errors
 * @param ctx - Telegraf context
 * @param text - Optional text to show
 */
async function safeAnswerCbQuery(ctx: Context, text?: string): Promise<void> {
  try {
    await ctx.answerCbQuery(text);
  } catch (error: any) {
    console.log("Ошибка при ответе на callback query:", error.message);
    // Ignore callback query errors, they are not critical
  }
}

/**
 * Sets up callback handlers for the bot
 * @param bot - Telegraf bot instance
 */
export function setupCallbackHandlers(bot: Telegraf<Context<Update>>) {
  /**
   * Show status filter
   */
  bot.action("show_status_filter", async (ctx) => {
    try {
      const tasks = dbService.getAllTasks();

      // Получаем статистику по статусам
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

      await ctx.editMessageText(text, {
        parse_mode: "HTML",
        ...getKeyboardByScreenState(tasks, SCREEN_STATE.STATUS_SELECTION),
      });

      await safeAnswerCbQuery(ctx, "Статусы задач");
    } catch (error) {
      console.log("Ошибка при показе экрана статусов:", error);
      await safeAnswerCbQuery(ctx, "Попробуйте еще раз");
    }
  });

  /**
   * Show project filter
   */
  bot.action("show_project_filter", async (ctx) => {
    const projects = dbService.getProjects();

    if (projects.length === 0) {
      await safeAnswerCbQuery(ctx, "⚠️ Нет доступных проектов");
      return;
    }

    try {
      await ctx.editMessageReplyMarkup(
        getKeyboardByScreenState([], SCREEN_STATE.PROJECT_SELECTION, {
          projects,
        }).reply_markup
      );
      await safeAnswerCbQuery(ctx, "Выберите проект");
    } catch (error) {
      console.log("Ошибка при изменении клавиатуры:", error);
      await safeAnswerCbQuery(ctx, "Попробуйте еще раз");
    }
  });

  /**
   * Filter by status
   */
  bot.action(/^filter_status:(.+)$/, async (ctx) => {
    const status: TASK_STATUS = ctx.match[1] as TASK_STATUS;

    try {
      let tasks;
      let header;
      let showCompleted = false;

      if (status === TASK_STATUS.ALL) {
        tasks = dbService.getAllTasks();
        header = createTaskListHeader();
        showCompleted = false; // Still hide completed in general list
      } else if (status === TASK_STATUS.DONE) {
        tasks = dbService.getTasksByFilter({ status });
        header = createTaskListHeader({ status });
        showCompleted = true; // Show only completed
      } else {
        tasks = dbService.getTasksByFilter({ status });
        header = createTaskListHeader({ status });
        showCompleted = false;
      }

      const newText = header + "\n\n" + formatTaskList(tasks, showCompleted);

      // Check if new text differs from current
      const currentMessage = ctx.callbackQuery?.message;
      if (currentMessage && "text" in currentMessage) {
        const currentText = currentMessage.text;

        // If it's the same filter, reset it (show active tasks)
        if (currentText === newText && status !== "all") {
          const allTasks = dbService.getAllTasks();
          const allTasksText =
            createTaskListHeader() + "\n\n" + formatTaskList(allTasks, false);

          await ctx.editMessageText(allTasksText, {
            parse_mode: "HTML",
            ...getKeyboardByScreenState(allTasks, SCREEN_STATE.MAIN_LIST),
          });
          await safeAnswerCbQuery(ctx, "Фильтр сброшен");
          return;
        }

        // If text hasn't changed
        if (currentText === newText) {
          await safeAnswerCbQuery(ctx, "Фильтр уже применен");
          return;
        }
      }

      const filteredTasksForKeyboard = showCompleted
        ? tasks
        : tasks.filter((task) => task.status !== TASK_STATUS.DONE);

      await ctx.editMessageText(newText, {
        parse_mode: "HTML",
        ...getKeyboardByScreenState(
          filteredTasksForKeyboard,
          SCREEN_STATE.FILTERED_BY_STATUS
        ),
      });

      await safeAnswerCbQuery(
        ctx,
        `Показаны задачи: ${
          status === TASK_STATUS.ALL
            ? "активные"
            : status === TASK_STATUS.DONE
            ? "выполненные"
            : status
        }`
      );
    } catch (error: any) {
      console.log("Ошибка при фильтрации по статусу:", error.message);
      await safeAnswerCbQuery(ctx, "Ошибка при фильтрации");
    }
  });

  /**
   * Filter by project
   */
  bot.action(/^filter_project:(.+)$/, async (ctx) => {
    const project = ctx.match[1];

    try {
      let tasks;
      let header;

      if (project === "all") {
        tasks = dbService.getAllTasks();
        header = createTaskListHeader();
      } else {
        tasks = dbService.getTasksByFilter({ project });
        header = createTaskListHeader({ project });
      }

      const newText = header + "\n\n" + formatTaskList(tasks, false); // Always hide completed

      // Check if new text differs from current
      const currentMessage = ctx.callbackQuery?.message;
      if (currentMessage && "text" in currentMessage) {
        const currentText = currentMessage.text;

        // If it's the same filter, reset it (show active tasks)
        if (currentText === newText && project !== "all") {
          const allTasks = dbService.getAllTasks();
          const allTasksText =
            createTaskListHeader() + "\n\n" + formatTaskList(allTasks, false);

          await ctx.editMessageText(allTasksText, {
            parse_mode: "HTML",
            ...getKeyboardByScreenState(allTasks, SCREEN_STATE.MAIN_LIST),
          });
          await safeAnswerCbQuery(ctx, "Фильтр сброшен");
          return;
        }

        // If text hasn't changed
        if (currentText === newText) {
          await safeAnswerCbQuery(ctx, "Фильтр уже применен");
          return;
        }
      }

      const filteredTasksForKeyboard = tasks.filter(
        (task) => task.status !== TASK_STATUS.DONE
      );

      await ctx.editMessageText(newText, {
        parse_mode: "HTML",
        ...getKeyboardByScreenState(
          filteredTasksForKeyboard,
          SCREEN_STATE.FILTERED_BY_PROJECT
        ),
      });

      await safeAnswerCbQuery(
        ctx,
        `Показан проект: ${project === "all" ? "все" : project}`
      );
    } catch (error: any) {
      console.log("Ошибка при фильтрации по проекту:", error.message);
      await safeAnswerCbQuery(ctx, "Ошибка при фильтрации");
    }
  });

  /**
   * Start task (change status to "in_progress")
   */
  bot.action(/^start_task:(\d+)$/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    const task = dbService.getTaskById(taskId);

    if (!task) {
      await safeAnswerCbQuery(ctx, "⚠️ Задача не найдена");
      return;
    }

    if (task.status === TASK_STATUS.IN_PROGRESS) {
      await safeAnswerCbQuery(ctx, "Задача уже в работе");
      return;
    }

    try {
      if (dbService.updateTaskStatus(taskId, TASK_STATUS.IN_PROGRESS)) {
        task.status = TASK_STATUS.IN_PROGRESS;
        await ctx.editMessageText(formatTask(task), {
          parse_mode: "HTML",
          link_preview_options: { is_disabled: true },
          ...createTaskActionsKeyboard(taskId, task.status),
        });

        await safeAnswerCbQuery(
          ctx,
          `🚧 Задача отмечена как '${TASK_STATUS_TITLE.IN_PROGRESS}'`
        );
      } else {
        await safeAnswerCbQuery(ctx, "⚠️ Ошибка при обновлении статуса");
      }
    } catch (error: any) {
      console.log("Ошибка при запуске задачи:", error.message);
      await safeAnswerCbQuery(ctx, "Ошибка при обновлении");
    }
  });

  /**
   * Complete task (change status to "done")
   */
  bot.action(/^done_task:(\d+)$/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    const task = dbService.getTaskById(taskId);

    if (!task) {
      await safeAnswerCbQuery(ctx, "⚠️ Задача не найдена");
      return;
    }

    if (task.status === TASK_STATUS.DONE) {
      await safeAnswerCbQuery(ctx, "Задача уже завершена");
      return;
    }

    try {
      if (dbService.updateTaskStatus(taskId, TASK_STATUS.DONE)) {
        task.status = TASK_STATUS.DONE;
        await ctx.editMessageText(formatTask(task), {
          parse_mode: "HTML",
          link_preview_options: { is_disabled: true },
          ...createTaskActionsKeyboard(taskId, task.status),
        });

        await safeAnswerCbQuery(
          ctx,
          `✅ Задача отмечена как '${TASK_STATUS_TITLE.DONE}'`
        );
      } else {
        await safeAnswerCbQuery(ctx, "⚠️ Ошибка при обновлении статуса");
      }
    } catch (error: any) {
      console.log("Ошибка при завершении задачи:", error.message);
      await safeAnswerCbQuery(ctx, "Ошибка при обновлении");
    }
  });

  /**
   * Request task deletion
   */
  bot.action(/^delete_task:(\d+)$/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    const task = dbService.getTaskById(taskId);

    if (!task) {
      await safeAnswerCbQuery(ctx, "⚠️ Задача не найдена");
      return;
    }

    try {
      await ctx.editMessageText(
        `🗑️ Вы уверены, что хотите удалить задачу #${taskId}?\n\n${task.description}`,
        { parse_mode: "HTML", ...createConfirmationKeyboard("delete", taskId) }
      );

      await safeAnswerCbQuery(ctx);
    } catch (error: any) {
      console.log("Ошибка при запросе удаления:", error.message);
      await safeAnswerCbQuery(ctx, "Ошибка при обработке запроса");
    }
  });

  /**
   * Confirm task deletion
   */
  bot.action(/^confirm_delete:(\d+)$/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);

    try {
      if (dbService.deleteTask(taskId)) {
        await ctx.editMessageText(`✅ Задача #${taskId} успешно удалена.`);
        await safeAnswerCbQuery(ctx, "Задача удалена");
      } else {
        await ctx.editMessageText(`⚠️ Не удалось удалить задачу #${taskId}.`);
        await safeAnswerCbQuery(ctx, "Ошибка при удалении");
      }
    } catch (error: any) {
      console.log("Ошибка при удалении задачи:", error.message);
      await safeAnswerCbQuery(ctx, "Ошибка при удалении");
    }
  });

  /**
   * Cancel task deletion
   */
  bot.action(/^cancel_delete:(\d+)$/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    const task = dbService.getTaskById(taskId);

    if (!task) {
      try {
        await ctx.editMessageText(`⚠️ Задача #${taskId} не найдена.`);
        await safeAnswerCbQuery(ctx);
      } catch (error: any) {
        console.log("Ошибка при отмене удаления:", error.message);
        await safeAnswerCbQuery(ctx, "Ошибка");
      }
      return;
    }

    try {
      await ctx.editMessageText(formatTask(task), {
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
        ...createTaskActionsKeyboard(taskId, task.status),
      });

      await safeAnswerCbQuery(ctx, "Удаление отменено");
    } catch (error: any) {
      console.log("Ошибка при отмене удаления:", error.message);
      await safeAnswerCbQuery(ctx, "Ошибка при отмене");
    }
  });

  /**
   * Select existing project
   */
  bot.action(/^select_project:(.+)$/, async (ctx) => {
    if (!ctx.chat) return;

    const project = ctx.match[1];
    const chatId = ctx.chat.id;

    // Check if there are analyzed tasks (new system)
    const analyzedTasks = sessionService.getAnalyzedTasks(chatId);
    if (analyzedTasks && analyzedTasks.length > 0) {
      try {
        // Create all tasks with selected project
        await createMultipleTasks(ctx, analyzedTasks, project, bot);

        // Delete project selection message
        try {
          await ctx.deleteMessage();
        } catch (error) {
          console.log("Не удалось удалить сообщение выбора проекта");
        }

        await safeAnswerCbQuery(
          ctx,
          `✅ Создано ${analyzedTasks.length} задач в проекте "${project}"`
        );
      } catch (error: any) {
        console.log("Ошибка при создании задач:", error.message);
        sessionService.clearUserData(chatId);
        await safeAnswerCbQuery(ctx, "Ошибка при создании задач");
      }
      return;
    }

    // Fallback: if old system is used (shouldn't happen, but just in case)
    await safeAnswerCbQuery(ctx, "❌ Данные задач потеряны");
    await ctx.editMessageText(
      "❌ Данные задач потеряны. Пожалуйста, перешлите сообщения заново."
    );
  });

  /**
   * Create new project
   */
  bot.action("create_new_project", async (ctx) => {
    if (!ctx.chat) return;

    const chatId = ctx.chat.id;

    // Check if there are analyzed tasks (new system)
    const analyzedTasks = sessionService.getAnalyzedTasks(chatId);
    if (analyzedTasks && analyzedTasks.length > 0) {
      try {
        // Set state to wait for project name
        sessionService.setUserState(chatId, "waiting_for_project_name");

        const tasksText = analyzedTasks
          .map((task, index) => `${index + 1}. ${task}`)
          .join("\n\n");

        await ctx.editMessageText(
          `📝 Задачи для создания:\n\n${tasksText}\n\n🆕 Введите название нового проекта:`
        );

        await safeAnswerCbQuery(ctx, "Введите название проекта");
      } catch (error: any) {
        console.log(
          "Ошибка при запросе нового проекта для задач:",
          error.message
        );
        sessionService.clearUserData(chatId);
        await safeAnswerCbQuery(ctx, "Ошибка при обработке");
      }
      return;
    }

    await safeAnswerCbQuery(ctx, "❌ Данные задач потеряны");
    await ctx.editMessageText(
      "❌ Данные задач потеряны. Пожалуйста, перешлите сообщения заново."
    );
  });

  /**
   * Task information (handler for task buttons)
   */
  bot.action(/^task_info:(\d+)$/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    const task = dbService.getTaskById(taskId);

    if (!task) {
      await safeAnswerCbQuery(ctx, "⚠️ Задача не найдена");
      return;
    }

    try {
      // Send task details in new message
      await ctx.reply(formatTask(task), {
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
        ...getKeyboardByScreenState([], SCREEN_STATE.TASK_DETAILS, {
          taskId: task.id,
          status: task.status,
        }),
      });

      await safeAnswerCbQuery(ctx, `Информация о задаче #${taskId}`);
    } catch (error: any) {
      console.log("Ошибка при получении информации о задаче:", error.message);
      await safeAnswerCbQuery(ctx, "Ошибка при получении информации");
    }
  });

  /**
   * Manage project
   */
  bot.action(/^manage_project:(.+)$/, async (ctx) => {
    const project = ctx.match[1];
    const stats = dbService.getProjectStats(project);

    try {
      const projectInfo =
        `📁 Проект: <b>${project}</b>\n\n` +
        `📊 Статистика:\n` +
        `   • Всего задач: ${stats.total}\n` +
        `   • ${TASK_STATUS_EMOJI.NOT_STARTED} ${TASK_STATUS_TITLE.NOT_STARTED}: ${stats.notStarted}\n` +
        `   • ${TASK_STATUS_EMOJI.IN_PROGRESS} ${TASK_STATUS_TITLE.IN_PROGRESS}: ${stats.inProgress}\n` +
        `   • ${TASK_STATUS_EMOJI.DONE} ${TASK_STATUS_TITLE.DONE}: ${stats.done}\n\n` +
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
   * Add new project
   */
  bot.action("add_new_project", async (ctx) => {
    if (!ctx.chat) return;

    const chatId = ctx.chat.id;

    try {
      // Set state to wait for project name
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
   * Clear project
   */
  bot.action(/^clear_project:(.+)$/, async (ctx) => {
    const project = ctx.match[1];

    try {
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
   * Delete project
   */
  bot.action(/^delete_project:(.+)$/, async (ctx) => {
    const project = ctx.match[1];

    try {
      const confirmMessage =
        `🗑️ Удаление проекта "${project}"\n\n` +
        `⚠️ Это действие удалит проект и ВСЕ его задачи!\n` +
        `Данные будут безвозвратно потеряны.\n\n` +
        `Вы уверены?`;

      await ctx.editMessageText(confirmMessage, {
        parse_mode: "HTML",
        ...createProjectConfirmationKeyboard("delete", project),
      });

      await safeAnswerCbQuery(ctx);
    } catch (error: any) {
      console.log("Ошибка при запросе удаления проекта:", error.message);
      await safeAnswerCbQuery(ctx, "Ошибка при обработке");
    }
  });

  /**
   * Confirm project clearing
   */
  bot.action(/^confirm_project_clear:(.+)$/, async (ctx) => {
    const project = ctx.match[1];

    try {
      const clearedCount = dbService.clearProject(project);

      await ctx.editMessageText(
        `✅ Проект "${project}" очищен.\n` + `Удалено задач: ${clearedCount}`
      );

      await safeAnswerCbQuery(ctx, "Проект очищен");
    } catch (error: any) {
      console.log("Ошибка при очистке проекта:", error.message);
      await ctx.editMessageText("❌ Ошибка при очистке проекта");
      await safeAnswerCbQuery(ctx, "Ошибка при очистке");
    }
  });

  /**
   * Confirm project deletion
   */
  bot.action(/^confirm_project_delete:(.+)$/, async (ctx) => {
    const project = ctx.match[1];

    try {
      const success = dbService.deleteProject(project);

      if (success) {
        await ctx.editMessageText(`✅ Проект "${project}" удален.`);
        await safeAnswerCbQuery(ctx, "Проект удален");
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
   * Cancel project clearing
   */
  bot.action(/^cancel_project_clear:(.+)$/, async (ctx) => {
    const project = ctx.match[1];

    try {
      const stats = dbService.getProjectStats(project);
      const projectInfo =
        `📁 Проект: <b>${project}</b>\n\n` +
        `📊 Статистика:\n` +
        `   • Всего задач: ${stats.total}\n` +
        `   • ${TASK_STATUS_EMOJI.NOT_STARTED} ${TASK_STATUS_TITLE.NOT_STARTED}: ${stats.notStarted}\n` +
        `   • ${TASK_STATUS_EMOJI.IN_PROGRESS} ${TASK_STATUS_TITLE.IN_PROGRESS}: ${stats.inProgress}\n` +
        `   • ${TASK_STATUS_EMOJI.DONE} ${TASK_STATUS_TITLE.DONE}: ${stats.done}\n\n` +
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
   * Cancel project deletion
   */
  bot.action(/^cancel_project_delete:(.+)$/, async (ctx) => {
    const project = ctx.match[1];

    try {
      const stats = dbService.getProjectStats(project);
      const projectInfo =
        `📁 Проект: <b>${project}</b>\n\n` +
        `📊 Статистика:\n` +
        `   • Всего задач: ${stats.total}\n` +
        `   • ${TASK_STATUS_EMOJI.NOT_STARTED} ${TASK_STATUS_TITLE.NOT_STARTED}: ${stats.notStarted}\n` +
        `   • ${TASK_STATUS_EMOJI.IN_PROGRESS} ${TASK_STATUS_TITLE.IN_PROGRESS}: ${stats.inProgress}\n` +
        `   • ${TASK_STATUS_EMOJI.DONE} ${TASK_STATUS_TITLE.DONE}: ${stats.done}\n\n` +
        `Выберите действие:`;

      await ctx.editMessageText(projectInfo, {
        parse_mode: "HTML",
        ...createProjectActionsKeyboard(project),
      });

      await safeAnswerCbQuery(ctx, "Удаление отменено");
    } catch (error: any) {
      console.log("Ошибка при отмене удаления:", error.message);
      await safeAnswerCbQuery(ctx, "Ошибка");
    }
  });

  /**
   * Back to projects list
   */
  bot.action("back_to_projects", async (ctx) => {
    try {
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
   * Fixed callback for project selection when creating tasks
   */
  bot.action(/^select_project_for_tasks:(.+)$/, async (ctx) => {
    if (!ctx.chat) return;

    const project = ctx.match[1];
    const chatId = ctx.chat.id;

    // Check if there are analyzed tasks
    const analyzedTasks = sessionService.getAnalyzedTasks(chatId);
    if (analyzedTasks && analyzedTasks.length > 0) {
      try {
        // Create all tasks with selected project
        await createMultipleTasks(ctx, analyzedTasks, project, bot);

        // Delete project selection message
        try {
          await ctx.deleteMessage();
        } catch (error) {
          console.log("Не удалось удалить сообщение выбора проекта");
        }

        await safeAnswerCbQuery(
          ctx,
          `✅ Создано ${analyzedTasks.length} задач в проекте "${project}"`
        );
      } catch (error: any) {
        console.log("Ошибка при создании задач:", error.message);
        sessionService.clearUserData(chatId);
        await safeAnswerCbQuery(ctx, "Ошибка при создании задач");
      }
      return;
    }

    await safeAnswerCbQuery(ctx, "❌ Данные задач потеряны");
    await ctx.editMessageText(
      "❌ Данные задач потеряны. Пожалуйста, перешлите сообщения заново."
    );
  });

  /**
   * Create new project for tasks
   */
  bot.action("create_new_project_for_tasks", async (ctx) => {
    if (!ctx.chat) return;

    const chatId = ctx.chat.id;

    // Check if there are analyzed tasks
    const analyzedTasks = sessionService.getAnalyzedTasks(chatId);
    if (analyzedTasks && analyzedTasks.length > 0) {
      try {
        // Set state to wait for project name
        sessionService.setUserState(chatId, "waiting_for_project_name");

        const tasksText = analyzedTasks
          .map((task, index) => `${index + 1}. ${task}`)
          .join("\n\n");

        await ctx.editMessageText(
          `📝 Задачи для создания:\n\n${tasksText}\n\n🆕 Введите название нового проекта:`
        );

        await safeAnswerCbQuery(ctx, "Введите название проекта");
      } catch (error: any) {
        console.log(
          "Ошибка при запросе нового проекта для задач:",
          error.message
        );
        sessionService.clearUserData(chatId);
        await safeAnswerCbQuery(ctx, "Ошибка при обработке");
      }
      return;
    }

    await safeAnswerCbQuery(ctx, "❌ Данные задач потеряны");
    await ctx.editMessageText(
      "❌ Данные задач потеряны. Пожалуйста, перешлите сообщения заново."
    );
  });

  /**
   * Cancel task creation
   */
  bot.action("cancel_tasks_creation", async (ctx) => {
    if (!ctx.chat) return;

    const chatId = ctx.chat.id;

    try {
      sessionService.clearUserData(chatId);

      await ctx.editMessageText("❌ Создание задач отменено.");
      await safeAnswerCbQuery(ctx, "Создание отменено");
    } catch (error: any) {
      console.log("Ошибка при отмене создания задач:", error.message);
      await safeAnswerCbQuery(ctx, "Ошибка при отмене");
    }
  });

  /**
   * Show task list (return from filters)
   */
  bot.action("show_task_list", async (ctx) => {
    try {
      const tasks = dbService.getAllTasks();
      const filteredTasks = tasks.filter(
        (task) => task.status !== TASK_STATUS.DONE
      );

      const text =
        createTaskListHeader() + "\n\n" + formatTaskList(tasks, false);

      await ctx.editMessageText(text, {
        parse_mode: "HTML",
        ...getKeyboardByScreenState(filteredTasks, SCREEN_STATE.MAIN_LIST),
      });

      await safeAnswerCbQuery(ctx, "Список задач");
    } catch (error) {
      console.log("Ошибка при возврате к списку задач:", error);
      await safeAnswerCbQuery(ctx, "Попробуйте еще раз");
    }
  });

  /**
   * Show status screen
   */
  bot.action("show_statuses_screen", async (ctx) => {
    try {
      const tasks = dbService.getAllTasks();

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

      await ctx.editMessageText(text, {
        parse_mode: "HTML",
        ...createStatusButtonsKeyboard(),
      });

      await safeAnswerCbQuery(ctx, "Статусы задач");
    } catch (error) {
      console.log("Ошибка при показе экрана статусов:", error);
      await safeAnswerCbQuery(ctx, "Попробуйте еще раз");
    }
  });
}
