/**
 * Module with methods for simple text analysis (without using API)
 */

/**
 * Simple text analysis without OpenAI
 * @param message - Message text to analyze
 * @returns Object containing task description
 */
export function simpleTextAnalysis(message: string): {
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
export function simpleGrouping(messages: string[]): string[] {
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
