import { expect, test } from '@playwright/test';
import { uniqueName } from './support/api';
import {
  loginThroughUi,
  registerIndividualThroughUi,
} from './support/browser';

test('an individual registers, logs in, restores the session, and logs out', async ({
  page,
}) => {
  const username = uniqueName('auth-user');

  await registerIndividualThroughUi(page, username);

  await page.goto('/profile');
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(
    page.getByRole('heading', { name: 'Log in to EduMeet' }),
  ).toBeVisible();

  await loginThroughUi(page, username);
  await page.reload();
  await expect(
    page.getByRole('link', { name: `Open ${username}'s profile` }),
  ).toBeVisible();

  await page.goto('/profile');
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(
    page.getByRole('heading', { name: 'Log in to EduMeet' }),
  ).toBeVisible();
});
