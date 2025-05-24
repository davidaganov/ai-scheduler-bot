import { Context, Telegraf } from "telegraf";
import { Update } from "telegraf/typings/core/types/typegram";
import dbService from "../../services/database";
import { getKeyboardByScreenState } from "../../utils";
import { SCREEN_STATE } from "../../types";

/**
 * Sets the handler for the /projects command
 * @param bot - Telegraf bot instance
 */
export function setupProjectsCommand(bot: Telegraf<Context<Update>>) {
  bot.command("projects", async (ctx) => {
    try {
      const projects = dbService.getProjects();

      if (projects.length === 0) {
        await ctx.reply(
          "📁 У вас пока нет проектов.\n\nНажмите кнопку ниже, чтобы создать первый проект:",
          getKeyboardByScreenState([], SCREEN_STATE.PROJECT_MANAGEMENT, {
            projects,
          })
        );
        return;
      }

      let projectsInfo = "📁 Управление проектами:\n\n";

      projects.forEach((project) => {
        const stats = dbService.getProjectStats(project);
        projectsInfo += `📂 <b>${project}</b>\n`;
        projectsInfo += `   📊 Всего: ${stats.total} | ⏳ ${stats.notStarted} | 🚧 ${stats.inProgress} | ✅ ${stats.done}\n\n`;
      });

      await ctx.replyWithHTML(
        projectsInfo,
        getKeyboardByScreenState([], SCREEN_STATE.PROJECT_MANAGEMENT, {
          projects,
        })
      );
    } catch (error) {
      console.log("Ошибка при обработке команды /projects:", error);
      await ctx.reply(
        "Произошла ошибка при получении списка проектов. Попробуйте позже."
      );
    }
  });
}
