import { Task } from "../types/task";
import { Job } from "./job";

type Data = { email: string; body: string };

export class EmailNotificationJob implements Job<Data> {
  async run(task: Task<Data>): Promise<void> {
    const { email, body } = task.data;
    console.log(`Sending email notification for task ${task.name}...`);

    if (body === "Error") {
      throw new Error(`Error sending email to ${email}`);
    }
    // Perform notification work
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Email sent!");
  }
}
