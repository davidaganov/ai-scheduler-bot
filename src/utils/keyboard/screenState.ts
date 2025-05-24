import { SCREEN_STATE } from "../../types";
import {
  createTaskListKeyboard,
  createFilteredByStatusKeyboard,
  createFilteredByProjectKeyboard,
  createTaskActionsKeyboard,
} from "./taskKeyboards";
import { createStatusButtonsKeyboard } from "./commonKeyboards";
import {
  createProjectFilterKeyboard,
  createProjectManagementKeyboard,
} from "./projectKeyboards";

/**
 * Returns appropriate keyboard based on current screen state
 * @param tasks - Array of tasks
 * @param screenState - Current screen state enum
 * @param options - Additional options
 * @returns Keyboard markup
 */
export function getKeyboardByScreenState(
  tasks: any[],
  screenState: SCREEN_STATE,
  options: any = {}
) {
  const { projects = [], taskId, status } = options;

  switch (screenState) {
    case SCREEN_STATE.MAIN_LIST:
      return createTaskListKeyboard(tasks);

    case SCREEN_STATE.FILTERED_BY_STATUS:
      return createFilteredByStatusKeyboard(tasks);

    case SCREEN_STATE.FILTERED_BY_PROJECT:
      return createFilteredByProjectKeyboard(tasks);

    case SCREEN_STATE.STATUS_SELECTION:
      return createStatusButtonsKeyboard();

    case SCREEN_STATE.PROJECT_SELECTION:
      return createProjectFilterKeyboard(projects);

    case SCREEN_STATE.PROJECT_MANAGEMENT:
      return createProjectManagementKeyboard(projects);

    case SCREEN_STATE.TASK_DETAILS:
      if (taskId && status) {
        return createTaskActionsKeyboard(taskId, status);
      }
      return createTaskListKeyboard(tasks);

    default:
      return createTaskListKeyboard(tasks);
  }
}
