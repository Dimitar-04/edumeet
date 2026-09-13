import { expect, test } from '@playwright/test';
import { registerOrganization, uniqueName } from './support/api';
import {
  installGoogleMapsMock,
  selectMockLocation,
} from './support/browser';

test('an organization creates an event and sees it in the application', async ({
  context,
  page,
}) => {
  await installGoogleMapsMock(context);
  const organizer = uniqueName('create-org');
  const eventTitle = `Created in browser ${uniqueName('event')}`;
  await registerOrganization(page.request, organizer);

  await page.goto('/events/create');
  await page.getByLabel('Event title *').fill(eventTitle);
  await page.getByLabel('Category *').selectOption('Technology');
  await page.getByLabel('Event format *').selectOption('Workshop');
  await page
    .getByLabel('Description *')
    .fill('This event was entered and published through the browser.');

  const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1_000);
  await page.getByLabel('Date *').fill(futureDate.toISOString().slice(0, 10));
  await page.getByLabel('Start time *').fill('18:30');
  await selectMockLocation(page);

  await page.getByRole('button', { name: 'Preview event' }).click();
  await expect(page.getByRole('heading', { name: eventTitle })).toBeVisible();
  await page.getByRole('button', { name: 'Publish event' }).click();
  await expect(page.getByRole('status')).toContainText('Your event is live!');

  await expect(page).toHaveURL(/\/events$/);
  await page.getByPlaceholder('Search events').fill(eventTitle);
  await expect(
    page.getByRole('link', { name: `View ${eventTitle}` }),
  ).toBeVisible();
});
