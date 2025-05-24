import { Context, Telegraf } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import dbService from "../../services/database";
import {
  formatTaskList,
  createTaskListHeader,
  getKeyboardByScreenState,
} from "../../utils";
import { TASK_STATUS, TASK_STATUS_EMOJI, SCREEN_STATE } from "../../types";
import { safeAnswerCbQuery } from "./utils";

/**
 * Sets callback handlers for filtering tasks
 * @param bot - Telegraf bot instance
 */
export function setupFilterCallbacks(bot: Telegraf<Context<Update>>) {
  /**
   * Show the status filter
   */
  bot.action("show_status_filter", async (ctx) => {
    try {
      console.log(`Навигация: Пользователь открыл фильтр по статусу`);

      const tasks = dbService.getAllTasks();

      // Get statistics by status
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
   * Show the project filter
   */
  bot.action("show_project_filter", async (ctx) => {
    const projects = dbService.getProjects();

    if (projects.length === 0) {
      await safeAnswerCbQuery(ctx, "⚠️ Нет доступных проектов");
      return;
    }

    try {
      console.log(`Навигация: Пользователь открыл фильтр по проектам`);

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
   * Status filter
   */
  bot.action(/^filter_status:(.+)$/, async (ctx) => {
    const status: TASK_STATUS = ctx.match[1] as TASK_STATUS;

    try {
      console.log(
        `Навигация: Пользователь выбрал фильтр по статусу "${status}"`
      );

      let tasks;
      let header;
      let showCompleted = false;

      if (status === TASK_STATUS.ALL) {
        tasks = dbService.getAllTasks();
        header = createTaskListHeader();
        showCompleted = false; // In the general list, we always hide completed
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

      // Check if the new text differs from the current one
      const currentMessage = ctx.callbackQuery?.message;
      if (currentMessage && "text" in currentMessage) {
        const currentText = currentMessage.text;

        // If this is the same filter, reset it (show active tasks)
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

        // If the text has not changed
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
   * Project filter
   */
  bot.action(/^filter_project:(.+)$/, async (ctx) => {
    const project = ctx.match[1];

    try {
      console.log(
        `Навигация: Пользователь выбрал фильтр по проекту "${project}"`
      );

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

      // Check if the new text differs from the current one
      const currentMessage = ctx.callbackQuery?.message;
      if (currentMessage && "text" in currentMessage) {
        const currentText = currentMessage.text;

        // If this is the same filter, reset it (show active tasks)
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

        // If the text has not changed
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
   * Show the task list (return from filters)
   */
  bot.action("show_task_list", async (ctx) => {
    try {
      console.log(`Навигация: Пользователь вернулся к списку задач`);

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
   * Show the status screen
   */
  bot.action("show_statuses_screen", async (ctx) => {
    try {
      console.log(`Навигация: Пользователь открыл экран статусов`);

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
        ...getKeyboardByScreenState(tasks, SCREEN_STATE.STATUS_SELECTION),
      });

      await safeAnswerCbQuery(ctx, "Статусы задач");
    } catch (error) {
      console.log("Ошибка при показе экрана статусов:", error);
      await safeAnswerCbQuery(ctx, "Попробуйте еще раз");
    }
  });
}
