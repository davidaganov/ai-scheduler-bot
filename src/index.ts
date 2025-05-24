import "dotenv/config";
import { Telegraf } from "telegraf";
import {
  setupCommandHandlers,
  setupCallbackHandlers,
  setupMessageHandlers,
} from "./handlers";

// Check for required environment variables
if (!process.env.TELEGRAM_BOT_TOKEN) {
  console.error("❌ Отсутствует TELEGRAM_BOT_TOKEN в .env файле");
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  console.error("❌ Отсутствует OPENAI_API_KEY в .env файле");
  process.exit(1);
}

console.log("🚀 Запуск бота...");

// Create bot instance
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Global error handler for the bot
bot.catch((err, ctx) => {
  console.error("Ошибка в боте:", err);
  try {
    ctx.reply("❌ Произошла ошибка. Попробуйте еще раз позже.");
  } catch (replyError) {
    console.error("Не удалось отправить сообщение об ошибке:", replyError);
  }
});

setupCommandHandlers(bot);
setupCallbackHandlers(bot);
setupMessageHandlers(bot);

bot
  .launch()
  .then(() => {
    console.log("✅ Бот успешно запущен!");
    console.log("🤖 Имя бота: @" + bot.botInfo?.username);
  })
  .catch((error) => {
    console.error("❌ Ошибка при запуске бота:", error);
    process.exit(1);
  });

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
