import { Queue } from "../queue/queue";
import { Task } from "../types/task";

export class Runner<T> {
  private queue: Queue<T>;
  private processTask: (task: Task<T>) => Promise<void>;

  constructor(queue: Queue<T>, processTask: (task: Task<T>) => Promise<void>) {
    this.queue = queue;
    this.processTask = processTask;
  }

  async run(task: Task<T>): Promise<void> {
    const newTotalAttempts = task.options.retry.totalAttempts + 1;
    try {
      await this.processTask(task);
    } catch (error) {
      // retry the task if it fails
      await this.queue.addTask({
        ...task,
        options: {
          ...task.options,
          retry: {
            ...task.options.retry,
            totalAttempts: newTotalAttempts,
          },
          delay: task.options.retry.delay * newTotalAttempts ** 2, // multiply by the square of the number of attempts
        },
      });
    }
  }
}
