import SessionService from "./sessionService";

/**
 * Exporting the single instance of the service for managing sessions
 */
export const sessionService = new SessionService();

/**
 * Helper function to register a handler for the next text message from a user
 * @param userId - User ID
 * @param handler - Handler function to process the message
 */
export const onNextTextMessage = (
  userId: number,
  handler: Parameters<SessionService["onNextTextMessage"]>[1]
): void => {
  sessionService.onNextTextMessage(userId, handler);
};
