import { Queue } from "../queue/queue.ts";
import { Task } from "../types/task.ts";
import { Runner } from "./runner.ts";

export class Worker<T> {
  private queue: Queue<T>;
  private concurrency: number;
  private activeTasks: Map<string, Promise<void>> = new Map();

  constructor(
    queue: Queue<T>,
    { concurrency = 1 } = {}
  ) {
    this.queue = queue;
    this.concurrency = concurrency;
  }

  async start() {
    const runner = new Runner(this.queue);
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
