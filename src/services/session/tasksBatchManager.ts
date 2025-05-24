import type { AccumulatedMessage, PendingTasksBatch } from "../../types";
import EventEmitter from "./eventEmitter";

/**
 * Class for managing accumulated message batches and tasks
 */
export default class TasksBatchManager extends EventEmitter {
  private pendingTasksBatches = new Map<number, PendingTasksBatch>();

  /**
   * Adds a message to the accumulation buffer
   * @param chatId - Chat ID
   * @param text - Text of the message
   * @param originalMessage - Original message object
   * @param userId - User ID
   */
  addMessageToBatch(
    chatId: number,
    text: string,
    originalMessage: any,
    userId?: number
  ): void {
    const now = new Date();

    let batch = this.pendingTasksBatches.get(chatId);

    if (!batch) {
      batch = {
        messages: [],
        chatId,
        lastMessageTime: now,
        userId,
      };
      this.pendingTasksBatches.set(chatId, batch);
    } else if (userId && !batch.userId) {
      batch.userId = userId;
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
   * Clears the message buffer
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
   * Forcibly starts processing accumulated messages
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
    this.emit("process_messages", chatId, batch.userId);
  }

  /**
   * Gets full information about the batch
   * @param chatId - Chat ID
   * @returns Batch of tasks or undefined
   */
  getAccumulatedBatch(chatId: number): PendingTasksBatch | undefined {
    return this.pendingTasksBatches.get(chatId);
  }

  /**
   * Sets the ID of the message with the status
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
