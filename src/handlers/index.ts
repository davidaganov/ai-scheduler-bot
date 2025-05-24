import { Context, Telegraf } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import { setupCommands } from "./commands";
import { setupCallbacks } from "./callbacks";
import {
  setupMessages,
  createTaskFromMessage,
  createMultipleTasks,
} from "./messages";

/**
 * Sets all command handlers
 * @param bot - Telegraf bot instance
 */
export function setupCommandHandlers(bot: Telegraf<Context<Update>>) {
  setupCommands(bot);
  console.log("✅ Команды настроены");
}

/**
 * Sets all callback handlers
 * @param bot - Telegraf bot instance
 */
export function setupCallbackHandlers(bot: Telegraf<Context<Update>>) {
  setupCallbacks(bot);
  console.log("✅ Обработчики callback-запросов настроены");
}

/**
 * Sets all message handlers
 * @param bot - Telegraf bot instance
 */
export function setupMessageHandlers(bot: Telegraf<Context<Update>>) {
  setupMessages(bot);
  console.log("✅ Обработчики сообщений настроены");
}

/**
 * Sets all bot event handlers
 * @param bot - Telegraf bot instance
 */
export function setupHandlers(bot: Telegraf<Context<Update>>) {
  // Set handlers in a specific order:
  // first commands, then callback queries, then messages
  setupCommandHandlers(bot);
  setupCallbackHandlers(bot);
  setupMessageHandlers(bot);

  console.log("✅ Все обработчики бота настроены");
}

// Export useful functions from other modules
export { createTaskFromMessage, createMultipleTasks };
