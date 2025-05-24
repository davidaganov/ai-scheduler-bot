import TasksBatchManager from "./tasksBatchManager";
import StateManager from "./stateManager";
import type { UserState } from "../../types";
import type { Context } from "telegraf";

/**
 * Main service for managing user sessions
 * Combines state management and task batches
 */
export default class SessionService {
  private tasksBatchManager: TasksBatchManager;
  private stateManager: StateManager;

  constructor() {
    this.tasksBatchManager = new TasksBatchManager();
    this.stateManager = new StateManager();
  }

  // Delegation of methods for managing task batches

  addMessageToBatch(chatId: number, text: string, originalMessage: any): void {
    this.tasksBatchManager.addMessageToBatch(chatId, text, originalMessage);
  }

  getAccumulatedMessages(chatId: number) {
    return this.tasksBatchManager.getAccumulatedMessages(chatId);
  }

  getAccumulatedBatch(chatId: number) {
    return this.tasksBatchManager.getAccumulatedBatch(chatId);
  }

  setAnalyzedTasks(chatId: number, tasks: string[]): void {
    this.tasksBatchManager.setAnalyzedTasks(chatId, tasks);
  }

  getAnalyzedTasks(chatId: number) {
    return this.tasksBatchManager.getAnalyzedTasks(chatId);
  }

  clearTasksBatch(chatId: number): void {
    this.tasksBatchManager.clearTasksBatch(chatId);
  }

  processAccumulatedMessages(chatId: number): void {
    this.tasksBatchManager.processAccumulatedMessages(chatId);
  }

  setStatusMessage(chatId: number, messageId: number): void {
    this.tasksBatchManager.setStatusMessage(chatId, messageId);
  }

  on(event: string, callback: (chatId: number) => void): void {
    this.tasksBatchManager.on(event, callback);
  }

  // Delegation of methods for managing user state

  setUserState(chatId: number, state: UserState): void {
    this.stateManager.setUserState(chatId, state);
  }

  getUserState(chatId: number): UserState {
    return this.stateManager.getUserState(chatId);
  }

  clearUserState(chatId: number): void {
    this.stateManager.clearUserState(chatId);
  }

  /**
   * Registers a handler for the next text message from a user
   * @param userId - User ID
   * @param handler - Handler function to process the message
   */
  onNextTextMessage(
    userId: number,
    handler: (context: Context, text: string) => Promise<void>
  ): void {
    this.stateManager.onNextTextMessage(userId, handler);
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
    return this.stateManager.handleNextTextMessage(userId, context, text);
  }

  // General methods

  /**
   * Clears all user data
   * @param chatId - Chat ID
   */
  clearUserData(chatId: number): void {
    this.clearTasksBatch(chatId);
    this.clearUserState(chatId);
  }
}
