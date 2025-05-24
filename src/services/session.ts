import type {
  AccumulatedMessage,
  PendingTasksBatch,
  UserState,
} from "../types";

/**
 * Service for managing user sessions
 */
class SessionService {
  private pendingTasksBatches = new Map<number, PendingTasksBatch>();
  private userStates = new Map<number, UserState>();

  /**
   * Adds message to accumulation buffer
   * @param chatId - Chat ID
   * @param text - Message text
   * @param originalMessage - Original message object
   */
  addMessageToBatch(chatId: number, text: string, originalMessage: any): void {
    const now = new Date();

    let batch = this.pendingTasksBatches.get(chatId);

    if (!batch) {
      batch = {
        messages: [],
        chatId,
        lastMessageTime: now,
      };
      this.pendingTasksBatches.set(chatId, batch);
    }

    // Add new message
    batch.messages.push({
      text,
      timestamp: now,
      originalMessage,
    });

    batch.lastMessageTime = now;

    // Reset previous timer
    if (batch.timeoutId) {
      clearTimeout(batch.timeoutId);
    }

    // Set new timer for 5 seconds
    batch.timeoutId = setTimeout(() => {
      this.processAccumulatedMessages(chatId);
    }, 5000);

    console.log(
      `Добавлено сообщение в буфер (${batch.messages.length} сообщений)`
    );
  }

  /**
   * Gets accumulated messages
   * @param chatId - Chat ID
   * @returns Array of accumulated messages or undefined
   */
  getAccumulatedMessages(chatId: number): AccumulatedMessage[] | undefined {
    return this.pendingTasksBatches.get(chatId)?.messages;
  }

  /**
   * Saves found tasks after analysis
   * @param chatId - Chat ID
   * @param tasks - Array of task descriptions
   */
  setAnalyzedTasks(chatId: number, tasks: string[]): void {
    const batch = this.pendingTasksBatches.get(chatId);
    if (batch) {
      batch.tasks = tasks;
    }
  }

  /**
   * Gets found tasks
   * @param chatId - Chat ID
   * @returns Array of task descriptions or undefined
   */
  getAnalyzedTasks(chatId: number): string[] | undefined {
    return this.pendingTasksBatches.get(chatId)?.tasks;
  }

  /**
   * Clears message buffer
   * @param chatId - Chat ID
   */
  clearTasksBatch(chatId: number): void {
    const batch = this.pendingTasksBatches.get(chatId);
    if (batch?.timeoutId) {
      clearTimeout(batch.timeoutId);
    }
    this.pendingTasksBatches.delete(chatId);
  }

  /**
   * Sets user state
   * @param chatId - Chat ID
   * @param state - User state
   */
  setUserState(chatId: number, state: UserState): void {
    this.userStates.set(chatId, state);
  }

  /**
   * Gets user state
   * @param chatId - Chat ID
   * @returns Current user state
   */
  getUserState(chatId: number): UserState {
    return this.userStates.get(chatId) || "idle";
  }

  /**
   * Resets user state to idle
   * @param chatId - Chat ID
   */
  clearUserState(chatId: number): void {
    this.userStates.delete(chatId);
  }

  /**
   * Clears all user data
   * @param chatId - Chat ID
   */
  clearUserData(chatId: number): void {
    this.clearTasksBatch(chatId);
    this.clearUserState(chatId);
  }

  /**
   * Forcefully starts processing accumulated messages
   * @param chatId - Chat ID
   */
  processAccumulatedMessages(chatId: number): void {
    const batch = this.pendingTasksBatches.get(chatId);
    if (!batch || batch.messages.length === 0) {
      return;
    }

    // Reset timer
    if (batch.timeoutId) {
      clearTimeout(batch.timeoutId);
      batch.timeoutId = undefined;
    }

    // Emit event for message processing
    // This will be handled in handlers/messages.ts
    this.emit("process_messages", chatId);
  }

  // Simple event emitter
  private eventCallbacks = new Map<string, ((chatId: number) => void)[]>();

  /**
   * Registers event listener
   * @param event - Event name
   * @param callback - Callback function
   */
  on(event: string, callback: (chatId: number) => void): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event)!.push(callback);
  }

  /**
   * Emits event
   * @param event - Event name
   * @param chatId - Chat ID
   */
  private emit(event: string, chatId: number): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(chatId));
    }
  }

  /**
   * Gets complete batch information
   * @param chatId - Chat ID
   * @returns Pending tasks batch or undefined
   */
  getAccumulatedBatch(chatId: number): PendingTasksBatch | undefined {
    return this.pendingTasksBatches.get(chatId);
  }

  /**
   * Sets status message ID
   * @param chatId - Chat ID
   * @param messageId - Message ID
   */
  setStatusMessage(chatId: number, messageId: number): void {
    const batch = this.pendingTasksBatches.get(chatId);
    if (batch) {
      batch.statusMessageId = messageId;
    }
  }
}

export const sessionService = new SessionService();
