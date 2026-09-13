import { execFileSync } from 'node:child_process';
import { expect, type APIRequestContext } from '@playwright/test';
import { composeFile } from './stack';

interface MailpitMessageSummary {
  ID: string;
  Subject: string;
}

interface MailpitMessagesResponse {
  messages: MailpitMessageSummary[];
}

interface MailpitMessage {
  Text: string;
}

export async function waitForAttendanceToken(
  request: APIRequestContext,
  eventTitle: string,
) {
  let lastSubjects: string[] = [];

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const listResponse = await request.get(
      'http://localhost:8026/api/v1/messages',
    );
    expect(listResponse.ok()).toBeTruthy();
    const list = (await listResponse.json()) as MailpitMessagesResponse;
    lastSubjects = list.messages.map((message) => message.Subject);
    const summary = list.messages.find(
      (message) => message.Subject === `Registration confirmed: ${eventTitle}`,
    );

    if (summary) {
      const messageResponse = await request.get(
        `http://localhost:8026/api/v1/message/${summary.ID}`,
      );
      expect(messageResponse.ok()).toBeTruthy();
      const message = (await messageResponse.json()) as MailpitMessage;
      const token = message.Text.match(
        /Attendance code:\s*([A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4})/,
      )?.[1];

      if (token) return token;
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error(
    `Attendance email was not captured. Mailpit subjects: ${lastSubjects.join(', ')}`,
  );
}

export function markEventAsPast(eventId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(eventId)) {
    throw new Error(`Invalid event id: ${eventId}`);
  }

  const sql = `UPDATE "EducationalEvents" SET "Date" = NOW() - INTERVAL '1 minute' WHERE "Id" = '${eventId}';`;

  execFileSync(
    'docker',
    [
      'compose',
      '-f',
      composeFile,
      'exec',
      '-T',
      'postgres',
      'psql',
      '-U',
      'postgres',
      '-d',
      'edumeet_e2e',
      '-v',
      'ON_ERROR_STOP=1',
      '--command',
      sql,
    ],
    { stdio: 'inherit' },
  );
}
