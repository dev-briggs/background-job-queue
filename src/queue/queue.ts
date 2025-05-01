import { Task, TaskOptions, TaskStatus } from "../types/task.ts";

export type QueueOptions = {
  retryAttempts: number;
  retryDelay: number;
};

export type OptionalTaskOptions = Partial<TaskOptions> & {
  retry?: Partial<TaskOptions["retry"]>;
};

export abstract class Queue<T> {
  protected queueName: string;
  protected options: QueueOptions;

  constructor(
    queueName: string,
    options: QueueOptions = { retryAttempts: 10, retryDelay: 1000 }
  ) {
    this.queueName = queueName;
    this.options = options;
  }

  async addTask(
    task: Omit<Task<T>, "id" | "options" | "status"> & {
      options?: OptionalTaskOptions;
      id?: string;
    }
  ) {
    const id = task.id ?? crypto.randomUUID();

    // Check if passed total number of attempts is greater than max attempts
    if (
      (task.options?.retry?.totalAttempts ?? 0) >=
      (task.options?.retry?.maxAttempts ?? 1)
    ) {
      console.error("Max attempts reached");
      return id;
    }

    await this.push({
      ...task,
      id,
      options: {
        // set default values for options
        delay: task.options?.delay ?? 0,
        priority: task.options?.priority ?? 0,
        retry: {
          totalAttempts: task.options?.retry?.totalAttempts ?? 0,
          maxAttempts:
            task.options?.retry?.maxAttempts ?? this.options.retryAttempts,
          delay: task.options?.retry?.delay ?? this.options.retryDelay,
        },
      },
    });

    return id;
  }

  // For adding things to the queue where we save it to the database
  protected abstract push(
    task: Task<T> & {
      options: { retry: Required<Task<T>["options"]["retry"]> };
    }
  ): Promise<unknown>;

  // Allows our actual workers to wait indefinitely for a task to be available
  abstract getOrWaitForTask(): Promise<
    | (Task<T> & { options: { retry: Required<Task<T>["options"]["retry"]> } })
    | null
  >;

  abstract get length(): Promise<number>;
}
