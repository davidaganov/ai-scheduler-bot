import { Context, Telegraf } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import { setupTaskCallbacks } from "./taskCallbacks";
import { setupProjectCallbacks } from "./projectCallbacks";
import { setupFilterCallbacks } from "./filterCallbacks";
import { setupNavigationCallbacks } from "./navigationCallbacks";
import { safeAnswerCbQuery } from "./utils";

/**
 * Sets all callback handlers
 * @param bot - Telegraf bot instance
 */
export function setupCallbacks(bot: Telegraf<Context<Update>>) {
  console.log("🔄 Настройка обработчиков callback-запросов...");

  // Register handlers in a specific order:
  // first navigation and filter handlers
  setupNavigationCallbacks(bot);
  console.log("✅ Обработчики навигации настроены");

  setupFilterCallbacks(bot);
  console.log("✅ Обработчики фильтров настроены");

  // then handlers for tasks and projects
  setupTaskCallbacks(bot);
  console.log("✅ Обработчики задач настроены");

  setupProjectCallbacks(bot);
  console.log("✅ Обработчики проектов настроены");

  // Process all remaining callback queries
  bot.action(/^.*$/, async (ctx) => {
    // Get the data of the callback query for debugging
    const callbackData =
      ctx.callbackQuery && "data" in ctx.callbackQuery
        ? ctx.callbackQuery.data
        : "undefined";

    console.log(`❌ Получен необработанный callback: ${callbackData}`);
    await safeAnswerCbQuery(ctx, "Действие недоступно");
  });

  console.log("✅ Все обработчики callback-запросов настроены");
}
