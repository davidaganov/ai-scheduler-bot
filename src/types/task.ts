import { TASK_STATUS } from "../types";

export interface Task {
  id?: number;
  description: string;
  project: string;
  status: TASK_STATUS;
  created_at: string;
}

export interface TaskFilter {
  status?: TASK_STATUS;
  project?: string;
}
