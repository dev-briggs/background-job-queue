export type TaskOptions = {
  delay: number;
  priority: number;
  retry: {
    totalAttempts: number;
    maxAttempts: number;
    delay: number;
  };
};

export enum TaskStatus {
  Queued = 'queued',
  InProgress = 'in_progress',
  Completed = 'completed',
  Failed = 'failed'
}

export type Task<T> = {
  id: string;
  name: string;
  type: string;
  data: T;
  options: TaskOptions;
};
