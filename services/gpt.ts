import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

/**
 * Asks GPT to extract task description from a message
 * @param message - Input message text
 * @returns Promise resolving to extracted task description
 */
export async function askGPT(message: string): Promise<string> {
  const prompt = `Извлеки краткое, понятное описание задачи из этого сообщения, без тегов и лишнего, сохранив существенные для решения задачи детали:
"${message}"`;

  const res = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  return res.choices[0]?.message?.content?.trim() ?? "Нет описания";
}
