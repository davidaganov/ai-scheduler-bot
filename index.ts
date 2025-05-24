import { config } from "dotenv";
config();

import { Telegraf } from "telegraf";
import { askGPT } from "./services/gpt";
import {
  addTask,
  getAllTasks,
  getTasksByStatus,
  updateTaskStatus,
  deleteTask,
} from "./services/storage";

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

/**
 * Formats tasks array into a readable string for Telegram message
 * @param tasks - Array of task objects to format
 * @returns Formatted string with task information, limited to 4000 characters
 */
function formatTasks(tasks: any[]): string {
  return tasks
    .map(
      (t) =>
        `#${t.id} [${t.status}] ${t.description} (${
          t.created_at.split("T")[0]
        })`
    )
    .join("\n")
    .slice(0, 4000); // Telegram message limit
}

/**
 * Handler for /tasks command
 * Shows all tasks or filters by status
 */
bot.command("tasks", (ctx) => {
  const args = ctx.message.text.split(" ");
  if (args.length > 1 && args[1] === "status" && args[2]) {
    const filtered = getTasksByStatus(args[2]);
    if (filtered.length === 0) return ctx.reply("Задач с таким статусом нет.");
    return ctx.reply(formatTasks(filtered));
  }

  const tasks = getAllTasks();
  if (tasks.length === 0) return ctx.reply("Задач пока нет.");
  ctx.reply(formatTasks(tasks));
});

/**
 * Handler for /done command
 * Marks specified task as done
 */
bot.command("done", (ctx) => {
  const id = parseInt(ctx.message.text.split(" ")[1]);
  if (!id) return ctx.reply("Укажи ID задачи, например: /done 3");
  if (updateTaskStatus(id, "done")) {
    ctx.reply(`Задача #${id} отмечена как сделанная ✅`);
  } else {
    ctx.reply(`Не удалось обновить задачу #${id}`);
  }
});

/**
 * Handler for /start command
 * Marks specified task as in progress
 */
bot.command("start", (ctx) => {
  const id = parseInt(ctx.message.text.split(" ")[1]);
  if (!id) return ctx.reply("Укажи ID задачи, например: /start 3");
  if (updateTaskStatus(id, "in_progress")) {
    ctx.reply(`Задача #${id} в работе 🚧`);
  } else {
    ctx.reply(`Не удалось обновить задачу #${id}`);
  }
});

/**
 * Handler for /delete command
 * Deletes specified task
 */
bot.command("delete", (ctx) => {
  const id = parseInt(ctx.message.text.split(" ")[1]);
  if (!id) return ctx.reply("Укажи ID задачи, например: /delete 3");
  if (deleteTask(id)) {
    ctx.reply(`Задача #${id} удалена 🗑️`);
  } else {
    ctx.reply(`Не удалось удалить задачу #${id}`);
  }
});

/**
 * Handler for all forwarded messages
 * Processes forwarded messages and creates tasks from them
 */
bot.on("message", async (ctx) => {
  const message = ctx.message;

  // Check if this is a forwarded message
  if (!("forward_from" in message || "forward_sender_name" in message)) {
    return ctx.reply("Пожалуйста, перешли сообщение от заказчика.");
  }

  // Support both caption and text content
  const text =
    "text" in message
      ? message.text
      : "caption" in message
      ? message.caption
      : "";

  if (!text?.trim()) {
    return ctx.reply("Пустое сообщение. Нечего анализировать.");
  }

  try {
    const description = await askGPT(text);

    const task = {
      description,
      project: "general",
      status: "not_started",
      created_at: new Date().toISOString(),
    };

    const id = addTask(task);
    ctx.reply(`🆕 Задача сохранена:

📌 ${task.description}
📁 ${task.project}
⏳ ${task.status}
📅 ${task.created_at.split("T")[0]}`);
  } catch (err) {
    console.error(err);
    ctx.reply("Ошибка при создании задачи.");
  }
});

bot.launch();
console.log("Бот запущен 🚀");
