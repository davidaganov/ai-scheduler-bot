import { Context, Telegraf } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import { setupTaskMessages } from "./taskMessages";

/**
 * Sets all message handlers
 * @param bot - Telegraf bot instance
 */
export function setupMessages(bot: Telegraf<Context<Update>>) {
  // Set message handlers for tasks
  setupTaskMessages(bot);

  console.log("✅ Обработчики сообщений настроены");
}

// Export common functions for creating tasks
export { createTaskFromMessage, createMultipleTasks } from "./taskMessages";
