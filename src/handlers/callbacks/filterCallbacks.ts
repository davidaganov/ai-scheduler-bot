import { Context, Telegraf } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import dbService from "../../services/database";
import {
  formatTaskList,
  createTaskListHeader,
  getKeyboardByScreenState,
} from "../../utils";
import {
  TASK_STATUS,
  TASK_STATUS_EMOJI,
  SCREEN_STATE,
  NAVIGATION_ACTION,
} from "../../types";
import { safeAnswerCbQuery } from "./utils";

/**
 * Sets callback handlers for filtering tasks
 * @param bot - Telegraf bot instance
 */
export function setupFilterCallbacks(bot: Telegraf<Context<Update>>) {
  /**
   * Show the status filter
   */
  bot.action(NAVIGATION_ACTION.SHOW_STATUS_FILTER, async (ctx) => {
    if (!ctx.from) return;
    const userId = ctx.from.id;

    try {
      console.log(`Навигация: Пользователь открыл фильтр по статусу`);

      const tasks = dbService.getAllTasks(userId);

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
  bot.action(NAVIGATION_ACTION.SHOW_PROJECT_FILTER, async (ctx) => {
    if (!ctx.from) return;
    const userId = ctx.from.id;

    try {
      console.log(`Навигация: Пользователь открыл фильтр по проектам`);

      const projects = dbService.getProjects(userId);

      if (projects.length === 0) {
        await ctx.editMessageText(
          "📁 У вас пока нет проектов.\n\nСначала создайте проект в разделе 'Управление проектами'.",
          getKeyboardByScreenState([], SCREEN_STATE.MAIN_LIST)
        );
        await safeAnswerCbQuery(ctx, "Проектов нет");
        return;
      }

      // Get the count of tasks for each project
      let projectList = `📋 Список задач • Проекты\n\n`;

      for (const project of projects) {
        const stats = dbService.getProjectStats(project, userId);
        projectList += `📁 <b>${project}</b>\n`;
        projectList += `   • Всего задач: ${stats.total}\n`;
        projectList += `   • Активных: ${
          stats.notStarted + stats.inProgress
        }\n\n`;
      }

      await ctx.editMessageText(projectList, {
        parse_mode: "HTML",
        ...getKeyboardByScreenState([], SCREEN_STATE.PROJECT_SELECTION, {
          projects,
        }),
      });

      await safeAnswerCbQuery(ctx, "Список проектов");
    } catch (error) {
      console.log("Ошибка при показе проектов:", error);
      await safeAnswerCbQuery(ctx, "Попробуйте еще раз");
    }
  });

  /**
   * Status filter
   */
  bot.action(/^filter_status:(.+)$/, async (ctx) => {
    const status: TASK_STATUS = ctx.match[1] as TASK_STATUS;
    if (!ctx.from) return;
    const userId = ctx.from.id;

    try {
      console.log(
        `Навигация: Пользователь выбрал фильтр по статусу "${status}"`
      );

      let tasks;
      let header;
      let showCompleted = false;

      if (status === TASK_STATUS.ALL) {
        tasks = dbService.getAllTasks(userId);
        header = createTaskListHeader();
        showCompleted = false; // In the general list, we always hide completed
      } else if (status === TASK_STATUS.DONE) {
        tasks = dbService.getTasksByFilter({ status, user_id: userId });
        header = createTaskListHeader({ status });
        showCompleted = true; // Show only completed
      } else {
        tasks = dbService.getTasksByFilter({ status, user_id: userId });
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
          const allTasks = dbService.getAllTasks(userId);
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
    if (!ctx.from) return;
    const userId = ctx.from.id;

    try {
      console.log(
        `Навигация: Пользователь выбрал фильтр по проекту "${project}"`
      );

      const tasks = dbService.getTasksByFilter({ project, user_id: userId });
      const activeTasks = tasks.filter(
        (task) => task.status !== TASK_STATUS.DONE
      );

      if (tasks.length === 0) {
        await ctx.editMessageText(
          `📁 Проект "${project}"\n\nВ этом проекте пока нет задач.`,
          getKeyboardByScreenState([], SCREEN_STATE.PROJECT_SELECTION, {})
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
      console.log("Ошибка при фильтрации по проекту:", error.message);
      await safeAnswerCbQuery(ctx, "Ошибка при фильтрации");
    }
  });

  /**
   * Show all tasks
   */
  bot.action(NAVIGATION_ACTION.SHOW_TASK_LIST, async (ctx) => {
    if (!ctx.from) return;
    const userId = ctx.from.id;

    try {
      console.log(`Навигация: Пользователь запросил все задачи`);

      const tasks = dbService.getAllTasks(userId);
      const activeTasks = tasks.filter(
        (task) => task.status !== TASK_STATUS.DONE
      );

      if (activeTasks.length === 0) {
        await ctx.editMessageText(
          "📋 Список задач пуст\n\nУ вас нет активных задач.\nСоздайте новую задачу, отправив сообщение.",
          getKeyboardByScreenState([], SCREEN_STATE.MAIN_LIST, {})
        );
        await safeAnswerCbQuery(ctx, "Нет активных задач");
        return;
      }

      const header = createTaskListHeader();
      const tasksText = header + "\n\n" + formatTaskList(activeTasks, false);

      await ctx.editMessageText(tasksText, {
        parse_mode: "HTML",
        ...getKeyboardByScreenState(activeTasks, SCREEN_STATE.MAIN_LIST, {}),
      });

      await safeAnswerCbQuery(ctx, "Все активные задачи");
    } catch (error: any) {
      console.log("Ошибка при отображении всех задач:", error.message);
      await safeAnswerCbQuery(ctx, "Ошибка при загрузке задач");
    }
  });

  /**
   * Show the status screen
   */
  bot.action(NAVIGATION_ACTION.SHOW_STATUSES_SCREEN, async (ctx) => {
    if (!ctx.from) return;
    const userId = ctx.from.id;

    try {
      console.log(`Навигация: Пользователь открыл экран статусов`);

      const tasks = dbService.getAllTasks(userId);

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
        ...getKeyboardByScreenState(tasks, SCREEN_STATE.STATUS_SELECTION, {}),
      });

      await safeAnswerCbQuery(ctx, "Статусы задач");
    } catch (error) {
      console.log("Ошибка при показе экрана статусов:", error);
      await safeAnswerCbQuery(ctx, "Попробуйте еще раз");
    }
  });
}
