import OpenAI from "openai";

/**
 * Service for interacting with OpenAI API and fallback text analysis
 */
class OpenAIService {
  private openai: OpenAI | null = null;
  private useOpenAI: boolean;

  constructor() {
    this.useOpenAI = !!process.env.OPENAI_API_KEY;

    if (this.useOpenAI) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        timeout: 15000, // 15 second timeout
      });
      console.log("OpenAI сервис инициализирован");
    } else {
      console.log("OpenAI отключен, используется простой анализ текста");
    }
  }

  /**
   * Analyzes message and extracts task description using OpenAI or fallback analysis
   * @param message - Message text to analyze
   * @returns Object containing task description
   */
  async extractTaskInfo(message: string): Promise<{ description: string }> {
    // If OpenAI is disabled or unavailable, use simple analysis
    if (!this.useOpenAI || !this.openai) {
      console.log("Используем простой анализ текста (OpenAI отключен)");
      return this.simpleTextAnalysis(message);
    }

    try {
      console.log("Отправляем запрос к OpenAI...");

      // Create Promise with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("OpenAI request timeout")), 10000); // 10 seconds
      });

      const apiPromise = this.openai.chat.completions.create({
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
        return this.simpleTextAnalysis(message);
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
          return this.simpleTextAnalysis(message);
        }
      } catch (parseError) {
        console.log("Ошибка парсинга JSON:", parseError);
        return this.simpleTextAnalysis(message);
      }
    } catch (error: any) {
      console.error("Ошибка при запросе к OpenAI:", error.message);

      // For any errors, return simple analysis
      console.log("Переключаемся на простой анализ текста");
      return this.simpleTextAnalysis(message);
    }
  }

  /**
   * Analyzes a group of messages and groups them into separate tasks
   * @param messages - Array of message strings to analyze
   * @returns Array of task descriptions
   */
  async groupMessagesIntoTasks(messages: string[]): Promise<string[]> {
    // If OpenAI is disabled or unavailable, use simple analysis
    if (!this.useOpenAI || !this.openai) {
      console.log(
        "Используем простой анализ для группировки (OpenAI отключен)"
      );
      return this.simpleGrouping(messages);
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

      const apiPromise = this.openai.chat.completions.create({
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
        return this.simpleGrouping(messages);
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
            return tasks.length > 0 ? tasks : this.simpleGrouping(messages);
          }
        }

        // If couldn't parse, use simple grouping
        console.log(
          "Не удалось распарсить массив задач, используем простую группировку"
        );
        return this.simpleGrouping(messages);
      } catch (parseError) {
        console.log("Ошибка парсинга JSON для группировки:", parseError);
        return this.simpleGrouping(messages);
      }
    } catch (error: any) {
      console.error(
        "Ошибка при запросе к OpenAI для группировки:",
        error.message
      );

      // For any errors, return simple grouping
      console.log("Переключаемся на простую группировку");
      return this.simpleGrouping(messages);
    }
  }

  /**
   * Simple text analysis without OpenAI
   * @param message - Message text to analyze
   * @returns Object containing task description
   */
  private simpleTextAnalysis(message: string): {
    description: string;
  } {
    // Extract first sentence as description
    const sentences = message.split(/[.!?]+/);
    const description =
      sentences[0]?.trim().slice(0, 100) || message.slice(0, 100);

    const result = { description };
    console.log("Простой анализ завершен:", result);
    return result;
  }

  /**
   * Simple message grouping without OpenAI
   * @param messages - Array of message strings
   * @returns Array of task descriptions
   */
  private simpleGrouping(messages: string[]): string[] {
    if (messages.length === 0) return [];

    // Each message becomes a separate task with its real content
    const tasks = messages.map((message) => {
      // Take first sentence or first 100 characters as task description
      const sentences = message.split(/[.!?]+/);
      let description = sentences[0]?.trim() || message.trim();

      // If description is very long, truncate it
      if (description.length > 100) {
        description = description.slice(0, 97) + "...";
      }

      return description;
    });

    console.log(`Простая группировка завершена: ${tasks.length} задач`, tasks);
    return tasks;
  }
}

export const openaiService = new OpenAIService();
