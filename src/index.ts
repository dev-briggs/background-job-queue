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
  options: {
    priority: 1,
  },
});

queue.addTask({
  data: { email: "test@test.com", body: "Bye" },
  name: "2",
  options: {
    priority: 3,
    delay: 10000,
  },
});

queue.addTask({
  data: { email: "test2@test.com", body: "Hello World" },
  name: "3",
  options: {
    priority: 2,
  },
});

queue.addTask({
  data: { email: "test2@test.com", body: "Error" },
  name: "4",
});

setTimeout(() => {
  queue.addTask({
    data: { email: "test@test.com", body: "High Priority" },
    name: "5",
    options: {
      priority: 5,
    },
  });
}, 2000);

const worker = new Worker(
  queue,
  async (task) => {
    console.log(`Start: W1 ${task.name}`);
    await sendEmail(task.data.email, task.data.body);
  },
  { concurrency: 1 }
);

worker.start();

function sendEmail(email: string, body: string) {
  if (body === "Error") {
    console.log(`Error sending email to ${email}`);
    throw new Error("Simulated error");
  }
  return new Promise((resolve) => setTimeout(resolve, 1000));
}
