import { expect, test } from '@playwright/test';
import {
  createEvent,
  registerIndividual,
  registerOrganization,
  uniqueName,
} from './support/api';

test('an individual registers for an event and sees it in the schedule', async ({
  page,
  request,
}) => {
  const organizer = uniqueName('schedule-org');
  const participant = uniqueName('schedule-user');
  const eventTitle = `Scheduled ${uniqueName('event')}`;

  await registerOrganization(request, organizer);
  const educationalEvent = await createEvent(request, eventTitle);
  await registerIndividual(page.request, participant);

  await page.goto(`/events/${educationalEvent.id}`);
  await page.getByRole('button', { name: 'Register for event' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Register for this event?');
  await dialog.getByRole('button', { name: 'Register', exact: true }).click();
  await expect(dialog).toContainText("You're registered.");
  await dialog.getByRole('button', { name: 'Done' }).click();

  await page.getByRole('link', { name: 'My schedule' }).click();
  await expect(page.getByRole('heading', { name: 'My schedule' })).toBeVisible();
  await expect(
    page.getByRole('link', { name: `View ${eventTitle}` }),
  ).toBeVisible();
});
