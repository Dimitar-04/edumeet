import { Buffer } from 'node:buffer';
import { expect, test } from '@playwright/test';
import { registerIndividual, uniqueName } from './support/api';

test('a user updates a profile and sees the persisted result', async ({ page }) => {
  const username = uniqueName('profile-user');
  const updatedUsername = uniqueName('updated-user');
  await registerIndividual(page.request, username);

  await page.goto('/profile');
  await expect(page.getByText(`@${username}`)).toBeVisible();

  await page.getByLabel('Username').fill(updatedUsername);
  await page.getByRole('button', { name: 'Save username' }).click();
  await expect(
    page.getByText('Your username has been updated.', { exact: true }),
  ).toBeVisible();

  await page.locator('#profile-image').setInputFiles({
    name: 'avatar.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2n9sAAAAASUVORK5CYII=',
      'base64',
    ),
  });
  await page.getByRole('button', { name: 'Save photo' }).click();
  await expect(
    page.getByText('Your profile photo has been updated.', { exact: true }),
  ).toBeVisible();

  await page.reload();
  await expect(page.getByText(`@${updatedUsername}`)).toBeVisible();
  await expect(
    page
      .getByLabel("E2E Student's profile picture")
      .locator('img'),
  ).toHaveAttribute('src', /\/uploads\/profile-images\//);
});
