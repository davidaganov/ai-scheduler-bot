import { Context, Telegraf } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import { Message } from "telegraf/typings/core/types/typegram";
import { sessionService } from "../../services";
import { openaiService } from "../../services/openai";
import { getKeyboardByScreenState, formatTask } from "../../utils";
import { SCREEN_STATE, TASK_STATUS } from "../../types";
import dbService from "../../services/database";

/**
 * Creates a task from a message
 * @param ctx - Telegraf context
 * @param message - User message
 * @param project - Project name
 * @returns Created task
 */
export async function createTaskFromMessage(
  ctx: Context,
  message: string,
  project = "Основной"
) {
  try {
    if (!ctx.from) throw new Error("Неизвестный пользователь");
    const userId = ctx.from.id;

    // Analyze the message
    const taskInfo = await openaiService.extractTaskInfo(message);

    // Create a task
    const taskId = dbService.addTask({
      description: taskInfo.description,
      project,
      status: TASK_STATUS.NOT_STARTED,
      created_at: new Date().toISOString(),
      user_id: userId,
    });

    const task = dbService.getTaskById(taskId, userId);

    if (!task) {
      throw new Error("Не удалось создать задачу");
    }

    // Send confirmation
    const taskMessage = await ctx.replyWithHTML(formatTask(task), {
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
      ...getKeyboardByScreenState([task], SCREEN_STATE.TASK_DETAILS, {
        taskId: task.id,
        status: task.status,
      }),
    });

    console.log(`Создана новая задача #${taskId}: ${taskInfo.description}`);

    return task;
  } catch (error: any) {
    console.log("Ошибка при создании задачи:", error.message);
    await ctx.reply(
      "⚠️ Произошла ошибка при создании задачи. Попробуйте еще раз."
    );
    return null;
  }
}

/**
 * Creates multiple tasks from a list of messages
 * @param ctx - Telegraf context
 * @param taskDescriptions - List of task descriptions
 * @param project - Project name
 * @param bot - Telegraf bot instance
 */
export async function createMultipleTasks(
  ctx: Context,
  taskDescriptions: string[],
  project: string,
  bot: Telegraf<Context<Update>>
) {
  try {
    const chatId = ctx.chat?.id;
    if (!chatId) return;
    if (!ctx.from) throw new Error("Неизвестный пользователь");
    const userId = ctx.from.id;

    const createdTasks = [];

    // Delete the status message if it was
    const batch = sessionService.getAccumulatedBatch(chatId);
    if (batch?.statusMessageId) {
      try {
        await bot.telegram.deleteMessage(chatId, batch.statusMessageId);
      } catch (e) {
        console.log("Не удалось удалить статусное сообщение:", e);
      }
    }

    // Create a status message about creating tasks
    const statusMsg = await ctx.reply(
      `⏳ Создаю ${taskDescriptions.length} задач...`
    );

    // Create each task
    for (const description of taskDescriptions) {
      const taskId = dbService.addTask({
        description,
        project,
        status: TASK_STATUS.NOT_STARTED,
        created_at: new Date().toISOString(),
        user_id: userId,
      });

      const task = dbService.getTaskById(taskId, userId);
      if (task) {
        createdTasks.push(task);
      }
    }

    // Update the status message
    await bot.telegram.editMessageText(
      chatId,
      statusMsg.message_id,
      undefined,
      `✅ Создано ${createdTasks.length} задач в проекте "${project}"`
    );

    // Send the list of created tasks
    const tasksListMessage = createdTasks
      .map(
        (task, idx) => `${idx + 1}. <b>${task.description}</b> (#${task.id})`
      )
      .join("\n\n");

    const projectInfo = `📁 Проект: <b>${project}</b>`;
    const fullMessage = `${projectInfo}\n\n📝 Созданные задачи:\n\n${tasksListMessage}`;

    await ctx.replyWithHTML(fullMessage, {
      parse_mode: "HTML",
      link_preview_options: { is_disabled: true },
      ...getKeyboardByScreenState([], SCREEN_STATE.MAIN_LIST, {}),
    });

    // Clear session data
    sessionService.clearUserData(chatId);

    console.log(
      `Создано ${createdTasks.length} задач в проекте "${project}" для пользователя ${chatId}`
    );

    return createdTasks;
  } catch (error: any) {
    console.log("Ошибка при создании задач:", error.message);
    await ctx.reply(
      "⚠️ Произошла ошибка при создании задач. Попробуйте еще раз."
    );
    return [];
  }
}

/**
 * Processes accumulated messages to create tasks
 * @param bot - Telegraf bot instance
 * @param chatId - Chat ID
 * @param userId - User ID
 */
export async function processAccumulatedMessages(
  bot: Telegraf<Context<Update>>,
  chatId: number,
  userId: number
) {
  try {
    const messages = sessionService.getAccumulatedMessages(chatId);
    if (!messages || messages.length === 0) return;

    console.log(
      `Обработка накопленных сообщений для чата ${chatId}: ${messages.length} сообщений`
    );

    // Send processing status
    const statusMsg = await bot.telegram.sendMessage(
      chatId,
      `⏳ Анализирую ${messages.length} сообщений...`
    );

    // Save the ID of the status message
    sessionService.setStatusMessage(chatId, statusMsg.message_id);

    // Extract the text of the messages
    const messageTexts = messages.map((msg) => msg.text);

    // Analyze the group of messages and group them into tasks
    const analyzedTasks = await openaiService.groupMessagesIntoTasks(
      messageTexts
    );

    // Save the analyzed tasks
    sessionService.setAnalyzedTasks(chatId, analyzedTasks);

    // Get available projects
    const projects = dbService.getProjects(userId);

    // Update the status message
    await bot.telegram.editMessageText(
      chatId,
      statusMsg.message_id,
      undefined,
      `📝 Создать ${analyzedTasks.length} задач:\n\n${analyzedTasks
        .map((task, index) => `${index + 1}. ${task}`)
        .join("\n\n")}\n\n📁 Выберите проект или создайте новый:`,
      {
        reply_markup: getKeyboardByScreenState(
          [],
          SCREEN_STATE.PROJECT_SELECTION,
          { projects }
        ).reply_markup,
      }
    );
  } catch (error: any) {
    console.log("Ошибка при обработке накопленных сообщений:", error.message);
    try {
      await bot.telegram.sendMessage(
        chatId,
        "⚠️ Произошла ошибка при анализе сообщений. Попробуйте еще раз."
      );
    } catch (e) {
      console.log("Не удалось отправить сообщение об ошибке:", e);
    }
    sessionService.clearUserData(chatId);
  }
}

/**
 * Sets message handlers for creating tasks
 * @param bot - Telegraf bot instance
 */
export function setupTaskMessages(bot: Telegraf<Context<Update>>) {
  // Processing the state of waiting for the project name
  bot.on("message", async (ctx, next) => {
    if (!ctx.chat || !ctx.from) return next();

    const chatId = ctx.chat.id;
    const userId = ctx.from.id;
    const state = sessionService.getUserState(chatId);

    // If we are waiting for the project name
    if (state === "waiting_for_project_name") {
      const message = ctx.message as Message.TextMessage;
      if (!message.text) return next();

      const projectName = message.text.trim();

      // Check if the project already exists
      const exists = dbService.projectExists(projectName, userId);

      if (exists) {
        await ctx.reply(`⚠️ Проект "${projectName}" уже существует.`);
        sessionService.clearUserState(chatId);
        return;
      }

      // Create a new project
      const success = dbService.addProject(projectName, userId);

      if (!success) {
        await ctx.reply(
          "⚠️ Не удалось создать проект. Попробуйте другое название."
        );
        sessionService.clearUserState(chatId);
        return;
      }

      // Check if there are accumulated tasks for creation
      const analyzedTasks = sessionService.getAnalyzedTasks(chatId);
      if (analyzedTasks && analyzedTasks.length > 0) {
        // Create tasks in a new project
        await createMultipleTasks(ctx, analyzedTasks, projectName, bot);
      } else {
        // Just report on the creation of the project
        await ctx.reply(`✅ Проект "${projectName}" успешно создан!`);
      }

      // Reset the state
      sessionService.clearUserState(chatId);
      return;
    }

    return next();
  });

  // Processing ordinary text messages for creating tasks
  bot.on("text", async (ctx, next) => {
    if (!ctx.chat || !ctx.from) return next();

    const chatId = ctx.chat.id;
    const userId = ctx.from.id;
    const state = sessionService.getUserState(chatId);
    const message = ctx.message;
    const text = message.text;

    // Check if there is a one-time handler for this user
    if (sessionService.handleNextTextMessage(userId, ctx, text)) {
      // If the handler is found and executed, break the middleware chain
      return;
    }

    // Skip if the user is in another state
    if (state !== "idle") return next();

    // If this is a command, skip
    if (text.startsWith("/")) return next();

    // Add the message to the accumulated buffer
    sessionService.addMessageToBatch(chatId, text, message, userId);

    return next();
  });

  // Processing forwarded messages
  bot.on("message", async (ctx, next) => {
    if (
      !ctx.chat ||
      !ctx.message ||
      !("forward_date" in ctx.message) ||
      !ctx.from
    ) {
      return next();
    }

    const chatId = ctx.chat.id;
    const userId = ctx.from.id;
    const state = sessionService.getUserState(chatId);

    // Skip if the user is in another state
    if (state !== "idle") return next();

    // Get the text of the forwarded message
    let text = "";
    const message = ctx.message;

    if ("text" in message) {
      text = message.text;
    } else if ("caption" in message && message.caption) {
      text = message.caption;
    } else {
      // Skip messages without text
      return next();
    }

    // Add to the buffer
    sessionService.addMessageToBatch(chatId, text, message, userId);

    return next();
  });

  // Event handler for accumulating messages
  sessionService.on("process_messages", (chatId, userId) => {
    if (userId) {
      processAccumulatedMessages(bot, chatId, userId);
    } else {
      console.error("Ошибка: userId не передан в обработчик process_messages");
    }
  });

  console.log("✅ Обработчики сообщений для задач настроены");
}
