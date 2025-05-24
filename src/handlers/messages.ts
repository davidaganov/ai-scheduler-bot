import { Context, Telegraf } from "telegraf";
import { Message, Update } from "telegraf/typings/core/types/typegram";
import dbService from "../services/database";
import { openaiService, sessionService } from "../services";
import {
  formatTask,
  createTaskActionsKeyboard,
  createTasksConfirmationKeyboard,
  createProjectManagementKeyboard,
} from "../utils";
import { type Task, TASK_STATUS } from "../types";

/**
 * Sets up message handlers for the bot
 * @param bot - Telegraf bot instance
 */
export function setupMessageHandlers(bot: Telegraf<Context<Update>>) {
  // Subscribe to accumulated messages processing event
  sessionService.on("process_messages", async (chatId) => {
    await processAccumulatedMessages(chatId, bot);
  });

  bot.on("message", async (ctx) => {
    const message = ctx.message as
      | Message.TextMessage
      | Message.CaptionableMessage;
    const chatId = ctx.chat.id;

    // Check user state
    const userState = sessionService.getUserState(chatId);

    // If user is waiting for project name input
    if (userState === "waiting_for_project_name") {
      await handleNewProjectName(ctx, bot);
      return;
    }

    // Check if this is a forwarded message
    if (!("forward_from" in message || "forward_sender_name" in message)) {
      return ctx.reply(
        "📝 Пожалуйста, перешли сообщение от заказчика для создания задачи."
      );
    }

    // Extract text from message (from text or caption)
    const text =
      "text" in message
        ? message.text
        : "caption" in message
        ? message.caption
        : "";

    if (!text?.trim()) {
      return ctx.reply("⚠️ Пустое сообщение. Нечего анализировать.");
    }

    // Add message to accumulation buffer
    sessionService.addMessageToBatch(chatId, text, message);
    sessionService.setUserState(chatId, "accumulating_messages");
  });
}

/**
 * Processes accumulated messages
 * @param chatId - Chat ID
 * @param bot - Telegraf bot instance
 */
async function processAccumulatedMessages(
  chatId: number,
  bot: Telegraf<Context<Update>>
) {
  const accumulatedMessages = sessionService.getAccumulatedMessages(chatId);

  if (!accumulatedMessages || accumulatedMessages.length === 0) {
    console.log("Нет накопленных сообщений для обработки");
    return;
  }

  console.log(
    `Обрабатываем ${accumulatedMessages.length} накопленных сообщений`
  );

  try {
    // Extract message texts
    const messageTexts = accumulatedMessages.map((msg) => msg.text);

    // Group messages into tasks using OpenAI
    const tasks = await openaiService.groupMessagesIntoTasks(messageTexts);

    if (tasks.length === 0) {
      throw new Error("Не удалось извлечь задачи из сообщений");
    }

    console.log(`Найдено ${tasks.length} задач:`, tasks);

    // Save found tasks
    sessionService.setAnalyzedTasks(chatId, tasks);

    // Format message with found tasks
    const tasksText = tasks
      .map((task, index) => `${index + 1}. ${task}`)
      .join("\n\n");

    // Get projects list
    const projects = dbService.getProjects();

    if (projects.length === 0) {
      // If no projects exist, ask to create new one
      sessionService.setUserState(chatId, "waiting_for_project_name");
      await bot.telegram.sendMessage(
        chatId,
        `📝 Найдено задач: ${tasks.length}\n\n${tasksText}\n\n🆕 Это ваши первые задачи! Введите название проекта:`
      );
    } else {
      // Show project selection
      await bot.telegram.sendMessage(
        chatId,
        `📝 Найдено задач: ${tasks.length}\n\n${tasksText}\n\n📁 Выберите проект для всех задач:`,
        createTasksConfirmationKeyboard(projects)
      );
    }
  } catch (error: any) {
    console.error("Ошибка при обработке накопленных сообщений:", error);

    await bot.telegram.sendMessage(
      chatId,
      "❌ Произошла ошибка при обработке сообщений. Попробуйте еще раз."
    );

    // Clear user data
    sessionService.clearUserData(chatId);
  }
}

/**
 * Handles new project name input for multiple tasks or project management
 * @param ctx - Telegraf context
 * @param bot - Telegraf bot instance
 */
async function handleNewProjectName(
  ctx: Context,
  bot: Telegraf<Context<Update>>
) {
  if (!ctx.chat) return;

  const chatId = ctx.chat.id;
  const message = ctx.message as Message.TextMessage;

  if (!("text" in message) || !message.text?.trim()) {
    return ctx.reply("⚠️ Пожалуйста, введите название проекта текстом.");
  }

  const projectName = message.text
    .trim()
    .replace(/[^a-zA-Z0-9а-яА-Я\s]/g, "") // Allow spaces and preserve case
    .replace(/\s+/g, " "); // Replace multiple spaces with single spaces

  if (projectName.length < 2) {
    return ctx.reply(
      "⚠️ Название проекта должно содержать минимум 2 символа. Попробуйте еще раз:"
    );
  }

  // Check if there are analyzed tasks (task creation mode)
  const analyzedTasks = sessionService.getAnalyzedTasks(chatId);

  if (analyzedTasks && analyzedTasks.length > 0) {
    // Task creation mode
    try {
      // Create all tasks with new project
      await createMultipleTasks(ctx, analyzedTasks, projectName, bot);
    } catch (error) {
      console.error("Ошибка при создании задач:", error);
      sessionService.clearUserData(chatId);
      await ctx.reply(
        "❌ Произошла ошибка при создании задач. Попробуйте еще раз."
      );
    }
  } else {
    // Project management mode - just create project
    try {
      if (dbService.addProject(projectName)) {
        await ctx.reply(`✅ Проект "${projectName}" создан!`);

        // Show updated projects list
        const projects = dbService.getProjects();
        let projectsInfo = "📁 Управление проектами:\n\n";

        projects.forEach((project) => {
          const stats = dbService.getProjectStats(project);
          projectsInfo += `📂 <b>${project}</b>\n`;
          projectsInfo += `   📊 Всего: ${stats.total} | ⏳ ${stats.notStarted} | 🚧 ${stats.inProgress} | ✅ ${stats.done}\n\n`;
        });

        await ctx.reply(projectsInfo, {
          parse_mode: "HTML",
          ...createProjectManagementKeyboard(projects),
        });
      } else {
        await ctx.reply(
          `⚠️ Проект "${projectName}" уже существует. Выберите другое название:`
        );
        return; // Don't clear state so user can enter another name
      }
    } catch (error) {
      console.error("Ошибка при создании проекта:", error);
      await ctx.reply(
        "❌ Произошла ошибка при создании проекта. Попробуйте еще раз."
      );
    }
  }

  // Clear user state
  sessionService.clearUserState(chatId);
}

/**
 * Creates multiple tasks from analyzed messages
 * @param ctx - Telegraf context
 * @param tasks - Array of task descriptions
 * @param project - Project name
 * @param bot - Telegraf bot instance
 */
export async function createMultipleTasks(
  ctx: Context,
  tasks: string[],
  project: string,
  bot: Telegraf<Context<Update>>
) {
  if (!ctx.chat) return;

  const chatId = ctx.chat.id;
  const createdTasks: Task[] = [];

  try {
    // Create each task
    for (const taskDescription of tasks) {
      const task = {
        description: taskDescription,
        project,
        status: TASK_STATUS.NOT_STARTED,
        created_at: new Date().toISOString(),
      };

      const taskId = dbService.addTask(task);
      createdTasks.push({ ...task, id: taskId });
    }

    // Send confirmation message
    await ctx.reply(
      `✅ Создано ${createdTasks.length} задач в проекте "${project}"!`
    );

    // Send each task as separate message with action buttons
    for (const task of createdTasks) {
      await bot.telegram.sendMessage(chatId, formatTask(task), {
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
        ...createTaskActionsKeyboard(task.id!, task.status),
      });
    }

    // Clear user data
    sessionService.clearUserData(chatId);
  } catch (error) {
    console.error("Ошибка при создании задач:", error);
    throw error;
  }
}
