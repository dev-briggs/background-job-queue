import { Job } from "../job/job";

import { EmailNotificationJob } from "../job/EmailNotificationJob";

const jobMap: Record<string, () => Job<unknown>> = {
  notification: () => new EmailNotificationJob(),
};

export function getJobForTaskType(taskType: string): Job<unknown> {
  const jobFactory = jobMap[taskType];
  if (!jobFactory) {
    throw new Error(`No job found for task name: ${taskType}`);
  }
  return jobFactory();
}
