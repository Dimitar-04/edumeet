import { expect, test } from '@playwright/test';
import {
  createEvent,
  registerOrganization,
  uniqueName,
} from './support/api';

test('a guest browses, searches, filters, and opens event details', async ({
  page,
  request,
}) => {
  const organizer = uniqueName('discovery-org');
  const eventTitle = `Playwright Technology ${uniqueName('event')}`;
  await registerOrganization(request, organizer);
  await createEvent(request, eventTitle);

  await page.goto('/events');
  await expect(page.getByRole('heading', { name: 'Discover events' })).toBeVisible();

  await page.getByPlaceholder('Search events').fill(eventTitle);
  await page.getByLabel('Filter events by category').getByRole('button', {
    name: 'Technology',
  }).click();

  const eventLink = page.getByRole('link', { name: `View ${eventTitle}` });
  await expect(eventLink).toBeVisible();
  await eventLink.click();

  await expect(page.getByRole('heading', { name: eventTitle })).toBeVisible();
  await expect(page.getByText('A browser-tested EduMeet learning event.')).toBeVisible();
  await expect(page.getByText('FINKI', { exact: true })).toBeVisible();
});
