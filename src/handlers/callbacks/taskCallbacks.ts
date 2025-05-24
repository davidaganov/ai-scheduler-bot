import { Context, Telegraf } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import dbService from "../../services/database";
import {
  formatTask,
  createConfirmationKeyboard,
  getKeyboardByScreenState,
} from "../../utils";
import { TASK_STATUS, TASK_STATUS_TITLE, SCREEN_STATE } from "../../types";
import { safeAnswerCbQuery } from "./utils";

/**
 * Sets callback handlers for working with tasks
 * @param bot - Telegraf bot instance
 */
export function setupTaskCallbacks(bot: Telegraf<Context<Update>>) {
  /**
   * Starting a task (changing the status to "in_progress")
   */
  bot.action(/^start_task:(\d+)$/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    if (!ctx.from) return;
    const userId = ctx.from.id;
    const task = dbService.getTaskById(taskId, userId);

    if (!task) {
      await safeAnswerCbQuery(ctx, "⚠️ Задача не найдена");
      return;
    }

    if (task.status === TASK_STATUS.IN_PROGRESS) {
      await safeAnswerCbQuery(ctx, "Задача уже в работе");
      return;
    }

    try {
      console.log(`Действие: Пользователь запустил задачу #${taskId} в работу`);

      if (dbService.updateTaskStatus(taskId, TASK_STATUS.IN_PROGRESS, userId)) {
        task.status = TASK_STATUS.IN_PROGRESS;
        await ctx.editMessageText(formatTask(task), {
          parse_mode: "HTML",
          link_preview_options: { is_disabled: true },
          ...getKeyboardByScreenState([task], SCREEN_STATE.TASK_DETAILS, {
            taskId: task.id,
            status: task.status,
          }),
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
   * Completing a task (changing the status to "done")
   */
  bot.action(/^done_task:(\d+)$/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    if (!ctx.from) return;
    const userId = ctx.from.id;
    const task = dbService.getTaskById(taskId, userId);

    if (!task) {
      await safeAnswerCbQuery(ctx, "⚠️ Задача не найдена");
      return;
    }

    if (task.status === TASK_STATUS.DONE) {
      await safeAnswerCbQuery(ctx, "Задача уже завершена");
      return;
    }

    try {
      console.log(
        `Действие: Пользователь пометил задачу #${taskId} как выполненную`
      );

      if (dbService.updateTaskStatus(taskId, TASK_STATUS.DONE, userId)) {
        task.status = TASK_STATUS.DONE;
        await ctx.editMessageText(formatTask(task), {
          parse_mode: "HTML",
          link_preview_options: { is_disabled: true },
          ...getKeyboardByScreenState([task], SCREEN_STATE.TASK_DETAILS, {
            taskId: task.id,
            status: task.status,
          }),
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
   * Request to delete a task
   */
  bot.action(/^delete_task:(\d+)$/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    if (!ctx.from) return;
    const userId = ctx.from.id;
    const task = dbService.getTaskById(taskId, userId);

    if (!task) {
      await safeAnswerCbQuery(ctx, "⚠️ Задача не найдена");
      return;
    }

    try {
      console.log(`Действие: Пользователь запросил удаление задачи #${taskId}`);

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
   * Confirmation of task deletion
   */
  bot.action(/^confirm_delete:(\d+)$/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    if (!ctx.from) return;
    const userId = ctx.from.id;

    try {
      console.log(
        `Действие: Пользователь подтвердил удаление задачи #${taskId}`
      );

      if (dbService.deleteTask(taskId, userId)) {
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
   * Cancellation of task deletion
   */
  bot.action(/^cancel_delete:(\d+)$/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    if (!ctx.from) return;
    const userId = ctx.from.id;
    const task = dbService.getTaskById(taskId, userId);

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
      console.log(`Действие: Пользователь отменил удаление задачи #${taskId}`);

      await ctx.editMessageText(formatTask(task), {
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
        ...getKeyboardByScreenState([task], SCREEN_STATE.TASK_DETAILS, {
          taskId: task.id,
          status: task.status,
        }),
      });

      await safeAnswerCbQuery(ctx, "Удаление отменено");
    } catch (error: any) {
      console.log("Ошибка при отмене удаления:", error.message);
      await safeAnswerCbQuery(ctx, "Ошибка при отмене");
    }
  });

  /**
   * Information about the task
   */
  bot.action(/^task_info:(\d+)$/, async (ctx) => {
    const taskId = parseInt(ctx.match[1]);
    if (!ctx.from) return;
    const userId = ctx.from.id;
    const task = dbService.getTaskById(taskId, userId);

    if (!task) {
      await safeAnswerCbQuery(ctx, "⚠️ Задача не найдена");
      return;
    }

    try {
      console.log(
        `Навигация: Пользователь открыл информацию о задаче #${taskId}`
      );

      // If there is a current message, edit it
      if (ctx.callbackQuery && ctx.callbackQuery.message) {
        await ctx.editMessageText(formatTask(task), {
          parse_mode: "HTML",
          link_preview_options: { is_disabled: true },
          ...getKeyboardByScreenState([task], SCREEN_STATE.TASK_DETAILS, {
            taskId: task.id,
            status: task.status,
          }),
        });
      } else {
        // If there is no current message, send a new one
        await ctx.reply(formatTask(task), {
          parse_mode: "HTML",
          link_preview_options: { is_disabled: true },
          ...getKeyboardByScreenState([task], SCREEN_STATE.TASK_DETAILS, {
            taskId: task.id,
            status: task.status,
          }),
        });
      }

      await safeAnswerCbQuery(ctx, `Информация о задаче #${taskId}`);
    } catch (error: any) {
      console.log("Ошибка при получении информации о задаче:", error.message);
      await safeAnswerCbQuery(ctx, "Ошибка при получении информации");
    }
  });
}
