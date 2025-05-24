import { Context, Telegraf } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import { setupStartCommand } from "./startCommand";
import { setupListCommand } from "./listCommand";
import { setupProjectsCommand } from "./projectsCommand";
import { setupHelpCommand } from "./helpCommand";

/**
 * Sets all command handlers
 * @param bot - Telegraf bot instance
 */
export function setupCommands(bot: Telegraf<Context<Update>>) {
  // Register command handlers
  setupStartCommand(bot);
  setupListCommand(bot);
  setupProjectsCommand(bot);
  setupHelpCommand(bot);

  console.log("✅ Обработчики команд настроены");
}
