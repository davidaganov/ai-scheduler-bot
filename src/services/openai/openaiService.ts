import OpenAI from "openai";

/**
 * Base service for working with the OpenAI API
 */
export default class OpenAIService {
  protected openai: OpenAI | null = null;
  protected useOpenAI: boolean;

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
   * Checks the availability of the OpenAI API
   * @returns true if the API is available
   */
  protected isApiAvailable(): boolean {
    return this.useOpenAI && this.openai !== null;
  }
}
