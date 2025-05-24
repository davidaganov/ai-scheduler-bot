import { Context, Telegraf } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import { getKeyboardByScreenState } from "../../utils";
import { SCREEN_STATE } from "../../types";

/**
 * Sets the handler for the /help command
 * @param bot - Telegraf bot instance
 */
export function setupHelpCommand(bot: Telegraf<Context<Update>>) {
  bot.command("help", async (ctx) => {
    try {
      const helpText = `
<b>📱 AI Scheduler Bot</b>

Этот бот поможет управлять задачами, организовывать их по проектам и отслеживать статус выполнения.

<b>Основные команды:</b>
• /start - Начать работу с ботом
• /list - Показать список задач
• /projects - Управление проектами

<b>Создание задач:</b>
• Просто отправьте сообщение с описанием задачи
• Можно отправить несколько сообщений подряд, бот объединит их в задачи

<b>Основные возможности:</b>
• Создание задач из сообщений
• Организация задач по проектам
• Отслеживание статуса выполнения
• Фильтрация и поиск

<b>Управление задачами:</b>
• Нажмите на задачу для управления ею
• Меняйте статус (не начато, в работе, сделано)
• Удаляйте задачи

<b>Проекты:</b>
• Создавайте проекты для группировки задач
• Просматривайте статистику по проектам
• Управляйте задачами в рамках проекта

<b>Версия:</b> 1.0.0
`;

      await ctx.replyWithHTML(helpText, {
        parse_mode: "HTML",
        link_preview_options: { is_disabled: true },
        ...getKeyboardByScreenState([], SCREEN_STATE.MAIN_LIST),
      });
    } catch (error) {
      console.log("Ошибка при обработке команды /help:", error);
      await ctx.reply(
        "Произошла ошибка при отображении справки. Попробуйте позже."
      );
    }
  });
}
