import { TASK_STATUS } from "../types";

export interface Task {
  id?: number;
  description: string;
  project: string;
  status: TASK_STATUS;
  created_at: string;
  user_id: number;
}

export interface TaskFilter {
  status?: TASK_STATUS;
  project?: string;
  user_id?: number;
}
