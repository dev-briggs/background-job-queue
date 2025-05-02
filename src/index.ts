import { RedisQueue } from "./queue/redis-adapter";
import { getEnv } from "./util/env";
import { Worker } from "./worker/worker";

const queue = new RedisQueue<{ email: string; body: string }>(
  getEnv("REDIS_URL"),
  "test-queue",
  {
    retryAttempts: 3,
    retryDelay: 1000,
  }
);

queue.addTask({
  data: { email: "test@test.com", body: "Hi" },
  name: "1",
  type: "notification",
  options: {
    priority: 1,
  },
});

queue.addTask({
  data: { email: "test@test.com", body: "Bye" },
  name: "2",
  type: "notification",
  options: {
    priority: 3,
    delay: 10000,
  },
});

queue.addTask({
  data: { email: "test2@test.com", body: "Hello World" },
  name: "3",
  type: "notification",
  options: {
    priority: 2,
  },
});

queue.addTask({
  data: { email: "test2@test.com", body: "Error" },
  name: "4",
  type: "notification",
});

setTimeout(() => {
  queue.addTask({
    data: { email: "test@test.com", body: "High Priority" },
    name: "5",
    type: "notification",
    options: {
      priority: 5,
    },
  });
}, 2000);

const worker = new Worker(queue, { concurrency: 1 });

worker.start();
