import { Queue } from "../queue/queue.ts";
import { Task } from "../types/task.ts";
import { Runner } from "./runner.ts";

export class Worker<T> {
  private queue: Queue<T>;
  private processTask: (task: Task<T>) => Promise<void>;
  private concurrency: number;
  private activeTasks: Map<string, Promise<void>> = new Map();

  constructor(
    queue: Queue<T>,
    processTask: (task: Task<T>) => Promise<void>,
    { concurrency = 1 } = {}
  ) {
    this.processTask = processTask;
    this.queue = queue;
    this.concurrency = concurrency;
  }

  async start() {
    const runner = new Runner(this.queue, this.processTask);
    while (true) {
      const task = await this.queue.getOrWaitForTask();
      if (task == null) {
        await new Promise((resolve) => setTimeout(resolve, 15000));
      } else {
        this.activeTasks.set(
          task.id,
          runner.run(task).finally(() => {
            this.activeTasks.delete(task.id);
          })
        );
      }

      if (this.activeTasks.size >= this.concurrency) {
        await Promise.any(this.activeTasks.values());
      }
    }
  }
}
