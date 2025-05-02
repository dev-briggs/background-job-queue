import { Task } from "../types/task";

export interface Job<T> {
  run(task: Task<T>): Promise<unknown>;
}
