import type { UserState } from "../../types";
import type { Context } from "telegraf";

/**
 * Class for managing user states
 */
export default class StateManager {
  private userStates = new Map<number, UserState>();
  private oneTimeHandlers = new Map<
    number,
    (context: Context, text: string) => Promise<void>
  >();

  /**
   * Sets the state of the user
   * @param chatId - Chat ID
   * @param state - User state
   */
  setUserState(chatId: number, state: UserState): void {
    this.userStates.set(chatId, state);
  }

  /**
   * Gets the state of the user
   * @param chatId - Chat ID
   * @returns Current user state
   */
  getUserState(chatId: number): UserState {
    return this.userStates.get(chatId) || "idle";
  }

  /**
   * Resets the user state to idle
   * @param chatId - Chat ID
   */
  clearUserState(chatId: number): void {
    this.userStates.delete(chatId);
  }

  /**
   * Registers a handler for the next text message from the user
   * @param userId - User ID
   * @param handler - Handler function to process the message
   */
  onNextTextMessage(
    userId: number,
    handler: (context: Context, text: string) => Promise<void>
  ): void {
    this.oneTimeHandlers.set(userId, handler);
  }

  /**
   * Processes the next text message with the registered handler
   * @param userId - User ID
   * @param context - Message context
   * @param text - Message text
   * @returns True if handler was found and executed, false otherwise
   */
  handleNextTextMessage(
    userId: number,
    context: Context,
    text: string
  ): boolean {
    const handler = this.oneTimeHandlers.get(userId);
    if (handler) {
      handler(context, text).catch((error) => {
        console.error("Error in one-time text message handler:", error);
      });
      this.oneTimeHandlers.delete(userId); // Remove handler after execution
      return true;
    }
    return false;
  }
}
