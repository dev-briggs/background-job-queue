import { getJobForTaskType } from "../factories/JobFactory";
import { Queue } from "../queue/queue";
import { Task } from "../types/task";

export class Runner<T> {
  private queue: Queue<T>;

  constructor(queue: Queue<T>) {
    this.queue = queue;
  }

  async run(task: Task<T>): Promise<void> {
    const newTotalAttempts = task.options.retry.totalAttempts + 1;
    const job = getJobForTaskType(task.type);
    try {
      await job.run(task);
    } catch (error) {
      console.log(`Error running task ${task.name}: ${error}`);
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
