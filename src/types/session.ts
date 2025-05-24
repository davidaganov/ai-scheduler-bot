/**
 * Interface for accumulated message
 */
export interface AccumulatedMessage {
  text: string;
  timestamp: Date;
  originalMessage: any; // Store original message for debugging
}

/**
 * Interface for temporary task creation data
 */
export interface PendingTasksBatch {
  messages: AccumulatedMessage[];
  tasks?: string[];
  chatId: number;
  lastMessageTime: Date;
  timeoutId?: NodeJS.Timeout;
  statusMessageId?: number;
  userId?: number;
}

/**
 * User state type
 */
export type UserState =
  | "idle"
  | "waiting_for_project_name"
  | "accumulating_messages";
