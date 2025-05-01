import IORedis from "ioredis";
import { Task } from "../types/task.ts";
import { Queue, QueueOptions } from "./queue.ts";

export class RedisQueue<T> extends Queue<T> {
  private redisBlocking: IORedis;
  private redisNonBlocking: IORedis;
  private redisSubscriber: IORedis;

  constructor(redisUrl: string, queueName: string, options?: QueueOptions) {
    super(queueName, options);

    this.redisBlocking = new IORedis(redisUrl); // to make sure only one worker connects to redis at a given time, when one thing is connected to redis it blocks all other connections
    this.redisNonBlocking = new IORedis(redisUrl); // to do things we don't need blocking for, like adding tasks to the queue
    this.redisSubscriber = new IORedis(redisUrl); // listens when we add new items to the queue, tell

    this.listenForExpiredTasks();
    this.checkForExpiredTasks();
  }

  get length() {
    return this.redisNonBlocking.zcard(this.activeTasksQueue);
  }

  async getOrWaitForTask() {
    const data = await this.redisBlocking.bzpopmin(this.activeTasksQueue, 0);
    return data?.[1] ? JSON.parse(data[1]) : null;
  }

  protected async push(task: Task<T>) {
    if (task.options.delay > 0) {
      return await this.redisNonBlocking
        .multi()
        .set(this.expiringTaskIdList(task.id), task.id)
        .pexpire(this.expiringTaskIdList(task.id), task.options.delay)
        .zadd(
          this.delayedTaskIdsQueue,
          Date.now() + task.options.delay,
          task.id
        )
        .hset(this.delayedTasksList, task.id, JSON.stringify(task))
        .exec();
    } else {
      return await this.addActiveTask(task);
    }
  }

  // Ready to execute tasks sorted by priority
  private get activeTasksQueue() {
    return `${this.queueName}:active`;
  }

  // Full task data for delayed tasks
  private get delayedTasksList() {
    return `${this.queueName}:tasks`;
  }

  // Delayed task ids sorted by execution date
  private get delayedTaskIdsQueue() {
    return `${this.queueName}:delayed`;
  }

  // Delayed task ids that will expire after the delay
  private expiringTaskIdList(taskId: string) {
    return `${this.queueName}:expiringTasks:${taskId}`;
  }

  private async addActiveTask(task: Task<T>) {
    return await this.redisNonBlocking.zadd(
      this.activeTasksQueue,
      (task.options.priority ?? 0) * -1,
      JSON.stringify(task)
    );
  }

  private async moveTaskToActive(taskId: string) {
    const task = await this.redisNonBlocking.hget(
      this.delayedTasksList,
      taskId
    );
    if (task == null) return;

    await this.addActiveTask(JSON.parse(task));
    await this.redisNonBlocking
      .multi()
      .zrem(this.delayedTaskIdsQueue, taskId)
      .hdel(this.delayedTasksList, taskId)
      .exec();
  }

  private async listenForExpiredTasks() {
    await this.redisSubscriber.subscribe("__keyevent@0__:expired");

    this.redisSubscriber.on("message", async (channel, message) => {
      if (channel !== "__keyevent@0__:expired") return;
      if (!message.startsWith(this.expiringTaskIdList(""))) return;

      const taskId = message.split(":").pop();
      if (taskId == null) return;

      await this.moveTaskToActive(taskId);
    });
  }

  private async checkForExpiredTasks() {
    const expiredTasks = await this.redisNonBlocking.zrangebyscore(
      this.delayedTaskIdsQueue,
      0,
      Date.now()
    );

    for (const taskId of expiredTasks) {
      await this.moveTaskToActive(taskId);
    }
  }
}
