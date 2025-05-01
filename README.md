# Background Job Queue with Redis

This project is a TypeScript-based background job queue system that uses Redis for task management. It supports task prioritization, delays, retries with exponential backoff, and concurrency control for workers.

## Features

- **Task Prioritization**: Higher priority tasks are processed first.
- **Task Delays**: Schedule tasks to run after a specific delay.
- **Retry Mechanism**: Automatically retries failed tasks with exponential backoff.
- **Concurrency Control**: Limit the number of tasks processed simultaneously.
- **Redis Integration**: Uses Redis for task storage and management.

## Project Structure
```
src/
├── index.ts # Entry point of the application
├── queue/
│ ├── queue.ts # Abstract queue class
│ ├── redis-adapter.ts # Redis-based queue implementation
├── types/
│ └── task.ts # Task type definitions
├── util/
│ └── env.ts # Utility for environment variable management
├── worker/
│ ├── runner.ts # Task runner logic
│ └── worker.ts # Worker implementation
```

## Prerequisites

- Node.js (v16 or higher)
- Redis server
    - enable key-event notification:
    ```bash
    config set notify-keyspace-events Ex
    ```
- `pnpm` package manager

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd background-job-queue
   ```
2. Install dependencies:
    ```bash
    pnpm install
    ```
3. Set up the environment variables:

    Copy `.env.example` to `.env`

## Usage

### Running the Application

Start the application in development mode:

```bash
pnpm run dev
```
