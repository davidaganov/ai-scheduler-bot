import { Context } from "telegraf";

/**
 * Safe answer to callback query to prevent errors
 * @param ctx - Telegraf context
 * @param text - Optional text to display
 */
export async function safeAnswerCbQuery(
  ctx: Context,
  text?: string
): Promise<void> {
  try {
    await ctx.answerCbQuery(text);
  } catch (error: any) {
    console.log("Ошибка при ответе на callback query:", error.message);
  }
}
