import { request } from '@playwright/test';
import { runCompose } from './stack';

async function waitFor(url: string) {
  const client = await request.newContext();

  try {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      try {
        const response = await client.get(url, { timeout: 2_000 });
        if (response.ok()) return;
      } catch {
        // The service is still starting.
      }

      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
  } finally {
    await client.dispose();
  }

  throw new Error(`Timed out waiting for ${url}.`);
}

export default async function globalSetup() {
  if (process.env.EDUMEET_E2E_REUSE_STACK === 'true') return;

  runCompose('down', '--volumes', '--remove-orphans');

  try {
    runCompose('up', '--detach', '--build');
    await Promise.all([
      waitFor('http://localhost:5063/api/events?pageNumber=1&pageSize=1'),
      waitFor('http://localhost:5174/events'),
      waitFor('http://localhost:8026/api/v1/messages'),
    ]);
  } catch (error) {
    runCompose('logs', '--no-color');
    runCompose('down', '--volumes', '--remove-orphans');
    throw error;
  }
}
