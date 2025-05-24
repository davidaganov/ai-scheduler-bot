import TasksBatchManager from "./tasksBatchManager";
import StateManager from "./stateManager";
import type { UserState } from "../../types";
import type { Context } from "telegraf";

/**
 * Service for managing user session data
 */
export default class SessionService {
  private tasksBatchManager: TasksBatchManager;
  private stateManager: StateManager;

  constructor() {
    this.tasksBatchManager = new TasksBatchManager();
    this.stateManager = new StateManager();
  }

  // Delegation of methods from StateManager
  setUserState(chatId: number, state: UserState): void {
    this.stateManager.setUserState(chatId, state);
  }

  getUserState(chatId: number): UserState {
    return this.stateManager.getUserState(chatId);
  }

  clearUserState(chatId: number): void {
    this.stateManager.clearUserState(chatId);
  }

  onNextTextMessage(
    userId: number,
    handler: (context: Context, text: string) => Promise<void>
  ): void {
    this.stateManager.onNextTextMessage(userId, handler);
  }

  handleNextTextMessage(
    userId: number,
    context: Context,
    text: string
  ): boolean {
    return this.stateManager.handleNextTextMessage(userId, context, text);
  }

  // Delegation of methods from TasksBatchManager
  addMessageToBatch(
    chatId: number,
    text: string,
    originalMessage: any,
    userId?: number
  ): void {
    this.tasksBatchManager.addMessageToBatch(
      chatId,
      text,
      originalMessage,
      userId
    );
  }

  getAccumulatedMessages(chatId: number): any[] | undefined {
    return this.tasksBatchManager.getAccumulatedMessages(chatId);
  }

  setAnalyzedTasks(chatId: number, tasks: string[]): void {
    this.tasksBatchManager.setAnalyzedTasks(chatId, tasks);
  }

  getAnalyzedTasks(chatId: number): string[] | undefined {
    return this.tasksBatchManager.getAnalyzedTasks(chatId);
  }

  clearUserData(chatId: number): void {
    this.clearUserState(chatId);
    this.tasksBatchManager.clearTasksBatch(chatId);
  }

  getAccumulatedBatch(chatId: number): any | undefined {
    return this.tasksBatchManager.getAccumulatedBatch(chatId);
  }

  setStatusMessage(chatId: number, messageId: number): void {
    this.tasksBatchManager.setStatusMessage(chatId, messageId);
  }

  on(event: string, callback: (chatId: number, userId?: number) => void): void {
    this.tasksBatchManager.on(event, callback);
  }
}
