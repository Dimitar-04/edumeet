import { expect, test } from '@playwright/test';
import {
  createEvent,
  registerIndividual,
  registerOrganization,
  uniqueName,
} from './support/api';
import {
  markEventAsPast,
  waitForAttendanceToken,
} from './support/system';

test('an organizer checks in a participant who then creates and deletes a review', async ({
  browser,
  page,
  request,
}) => {
  const organizerName = uniqueName('attendance-org');
  const participantName = uniqueName('attendance-user');
  const eventTitle = `Attendance ${uniqueName('event')}`;

  const organizerContext = await browser.newContext();
  const organizerPage = await organizerContext.newPage();

  try {
    await registerOrganization(organizerPage.request, organizerName);
    const educationalEvent = await createEvent(
      organizerPage.request,
      eventTitle,
      new Date(Date.now() + 30 * 60 * 1_000),
    );
    await registerIndividual(page.request, participantName);

    await page.goto(`/events/${educationalEvent.id}`);
    await page.getByRole('button', { name: 'Register for event' }).click();
    const registrationDialog = page.getByRole('dialog');
    await registrationDialog
      .getByRole('button', { name: 'Register', exact: true })
      .click();
    await expect(registrationDialog).toContainText("You're registered.");
    await registrationDialog.getByRole('button', { name: 'Done' }).click();

    const attendanceToken = await waitForAttendanceToken(request, eventTitle);

    await organizerPage.goto(`/events/${educationalEvent.id}`);
    await organizerPage.getByRole('link', { name: 'Manage attendance' }).click();
    await organizerPage.getByLabel('Attendance code').fill(attendanceToken);
    await organizerPage.getByRole('button', { name: 'Check in' }).click();
    await expect(organizerPage.getByRole('status')).toContainText(
      'Check-in successful',
    );
    await expect(
      organizerPage.getByText('E2E Student', { exact: true }),
    ).toBeVisible();

    markEventAsPast(educationalEvent.id);
    await page.goto(`/events/${educationalEvent.id}`);
    await page.getByRole('button', { name: 'Write a review' }).click();
    const reviewDialog = page.getByRole('dialog');
    await reviewDialog.getByRole('button', { name: '5', exact: true }).click();
    await reviewDialog
      .getByLabel('Your experience')
      .fill('Excellent end-to-end learning experience.');
    await reviewDialog.getByRole('button', { name: 'Publish review' }).click();
    await expect(reviewDialog).toContainText('Thank you for reviewing.');
    await reviewDialog.getByRole('button', { name: 'Done' }).click();
    await expect(
      page.getByText('Excellent end-to-end learning experience.'),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Remove your review' }).click();
    const deleteDialog = page.getByRole('dialog');
    await deleteDialog.getByRole('button', { name: 'Remove review' }).click();
    await expect(
      page.getByText('No attendee reviews have been submitted yet.'),
    ).toBeVisible();
  } finally {
    await organizerContext.close();
  }
});
