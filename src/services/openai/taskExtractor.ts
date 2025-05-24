import OpenAIService from "./openaiService";
import { simpleTextAnalysis, simpleGrouping } from "./fallbackAnalysis";

/**
 * Class for extracting information about tasks from messages
 */
export default class TaskExtractor extends OpenAIService {
  /**
   * Analyzes a message and extracts a task description
   * @param message - Text of the message to analyze
   * @returns Object with the task description
   */
  async extractTaskInfo(message: string): Promise<{ description: string }> {
    // If OpenAI is disabled or unavailable, use simple analysis
    if (!this.isApiAvailable()) {
      console.log("Используем простой анализ текста (OpenAI отключен)");
      return simpleTextAnalysis(message);
    }

    try {
      console.log("Отправляем запрос к OpenAI...");

      // Create Promise with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("OpenAI request timeout")), 10000); // 10 seconds
      });

      const apiPromise = this.openai!.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `Анализируй текст и извлекай краткое описание задачи. Отвечай только JSON: {"description": "краткая задача"}`,
          },
          {
            role: "user",
            content: message.slice(0, 500), // Limit input text length
          },
        ],
        temperature: 0.1,
        max_tokens: 100,
      });

      // Race between API request and timeout
      const response = (await Promise.race([
        apiPromise,
        timeoutPromise,
      ])) as any;

      const content = response.choices?.[0]?.message?.content?.trim();
      console.log("Ответ от OpenAI:", content);

      if (!content) {
        console.log("Пустой ответ от OpenAI, используем простой анализ");
        return simpleTextAnalysis(message);
      }

      try {
        // Try to extract JSON from response
        const jsonMatch = content.match(/\{[^}]+\}/);
        if (jsonMatch) {
          const parsedContent = JSON.parse(jsonMatch[0]);
          const result = {
            description:
              parsedContent.description?.slice(0, 100) || message.slice(0, 100),
          };
          console.log("Успешно обработано через OpenAI:", result);
          return result;
        } else {
          // If JSON not found, use simple text analysis
          console.log("JSON не найден, используем простой анализ");
          return simpleTextAnalysis(message);
        }
      } catch (parseError) {
        console.log("Ошибка парсинга JSON:", parseError);
        return simpleTextAnalysis(message);
      }
    } catch (error: any) {
      console.error("Ошибка при запросе к OpenAI:", error.message);

      // For any errors, return simple analysis
      console.log("Переключаемся на простой анализ текста");
      return simpleTextAnalysis(message);
    }
  }

  /**
   * Analyzes a group of messages and groups them into separate tasks
   * @param messages - Array of text messages to analyze
   * @returns Array of task descriptions
   */
  async groupMessagesIntoTasks(messages: string[]): Promise<string[]> {
    // If OpenAI is disabled or unavailable, use simple analysis
    if (!this.isApiAvailable()) {
      console.log(
        "Используем простой анализ для группировки (OpenAI отключен)"
      );
      return simpleGrouping(messages);
    }

    try {
      console.log(
        `Отправляем запрос к OpenAI для группировки ${messages.length} сообщений...`
      );

      // Combine all messages
      const combinedText = messages
        .map((msg, idx) => `Сообщение ${idx + 1}: ${msg}`)
        .join("\n\n");

      // Create Promise with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("OpenAI request timeout")), 15000); // 15 seconds for complex analysis
      });

      const apiPromise = this.openai!.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `Проанализируй сообщения от заказчика и сгруппируй их в отдельные задачи.
Каждая задача должна быть логически связанной единицей работы с ПОНЯТНЫМ ОПИСАНИЕМ.
Отвечай только JSON массивом строк с реальными описаниями задач: ["Обновить ссылку на GitHub", "Заменить ссылки в футере", "Добавить текст и иконки"]
НЕ используй шаблонные названия типа "Задача 1", "Задача 2" - только конкретные описания работ.`,
          },
          {
            role: "user",
            content: combinedText.slice(0, 2000),
          },
        ],
        temperature: 0.2,
        max_tokens: 300,
      });

      // Race between API request and timeout
      const response = (await Promise.race([
        apiPromise,
        timeoutPromise,
      ])) as any;

      const content = response.choices?.[0]?.message?.content?.trim();
      console.log("Ответ от OpenAI для группировки:", content);

      if (!content) {
        console.log("Пустой ответ от OpenAI, используем простую группировку");
        return simpleGrouping(messages);
      }

      try {
        // Try to extract JSON array from response
        const jsonMatch = content.match(/\[[^\]]+\]/);
        if (jsonMatch) {
          const parsedContent = JSON.parse(jsonMatch[0]);
          if (Array.isArray(parsedContent) && parsedContent.length > 0) {
            const tasks = parsedContent
              .filter((task) => typeof task === "string" && task.trim())
              .map((task) => task.slice(0, 150)); // Limit each task length

            console.log(
              `Успешно сгруппировано в ${tasks.length} задач:`,
              tasks
            );
            return tasks.length > 0 ? tasks : simpleGrouping(messages);
          }
        }

        // If couldn't parse, use simple grouping
        console.log(
          "Не удалось распарсить массив задач, используем простую группировку"
        );
        return simpleGrouping(messages);
      } catch (parseError) {
        console.log("Ошибка парсинга JSON для группировки:", parseError);
        return simpleGrouping(messages);
      }
    } catch (error: any) {
      console.error(
        "Ошибка при запросе к OpenAI для группировки:",
        error.message
      );

      // For any errors, return simple grouping
      console.log("Переключаемся на простую группировку");
      return simpleGrouping(messages);
    }
  }
}
