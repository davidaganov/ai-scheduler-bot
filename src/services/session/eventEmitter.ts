/**
 * Simple implementation of the event mechanism
 */
export default class EventEmitter {
  private eventCallbacks = new Map<string, ((chatId: number) => void)[]>();

  /**
   * Registers an event listener
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
   * Generates an event
   * @param event - Event name
   * @param chatId - Chat ID
   */
  protected emit(event: string, chatId: number): void {
    const callbacks = this.eventCallbacks.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(chatId));
    }
  }
}
