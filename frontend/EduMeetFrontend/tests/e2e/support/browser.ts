import { expect, type BrowserContext, type Page } from '@playwright/test';
import { testPassword } from './api';

export async function registerIndividualThroughUi(
  page: Page,
  username: string,
) {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Sign up' }).click();
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Email').fill(`${username}@example.com`);
  await page.getByLabel('First name').fill('E2E');
  await page.getByLabel('Last name').fill('Student');
  await page.getByLabel('Password', { exact: true }).fill(testPassword);
  await page.getByLabel('Confirm password').fill(testPassword);
  await page.getByRole('button', { name: 'Sign up' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole('link', { name: `Open ${username}'s profile` }),
  ).toBeVisible();
}

export async function loginThroughUi(page: Page, username: string) {
  await page.goto('/login');
  await page.getByLabel('Email or username').fill(username);
  await page.getByLabel('Password').fill(testPassword);
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole('link', { name: `Open ${username}'s profile` }),
  ).toBeVisible();
}

export async function installGoogleMapsMock(context: BrowserContext) {
  await context.addInitScript(() => {
    class FakeMap {
      fitBounds() {}
      setCenter() {}
      setZoom() {}
    }

    class FakeAdvancedMarkerElement {
      map: unknown;
      position: unknown;
      title?: string;

      constructor(options: {
        map: unknown;
        position: unknown;
        title?: string;
      }) {
        this.map = options.map;
        this.position = options.position;
        this.title = options.title;
      }
    }

    class FakePlaceAutocompleteElement extends HTMLElement {
      includedRegionCodes: string[] = [];
      placeholder = '';
    }

    if (!customElements.get('gmp-place-autocomplete')) {
      customElements.define(
        'gmp-place-autocomplete',
        FakePlaceAutocompleteElement,
      );
    }

    const maps = {
      importLibrary: async (libraryName: string) => {
        if (libraryName === 'maps') return { Map: FakeMap };
        if (libraryName === 'places') {
          return { PlaceAutocompleteElement: FakePlaceAutocompleteElement };
        }
        if (libraryName === 'marker') {
          return { AdvancedMarkerElement: FakeAdvancedMarkerElement };
        }
        return {};
      },
    };

    Object.defineProperty(window, 'google', {
      configurable: true,
      value: { maps },
    });
  });
}

export async function selectMockLocation(page: Page) {
  await page
    .locator('gmp-place-autocomplete')
    .waitFor({ state: 'attached' });

  await page.locator('gmp-place-autocomplete').evaluate((element) => {
    const selectionEvent = new Event('gmp-select');
    const location = {
      lat: () => 42.004,
      lng: () => 21.409,
    };
    const place = {
      id: 'e2e-finki-place',
      displayName: 'FINKI',
      formattedAddress: 'Rugjer Boshkovikj 16, Skopje',
      location,
      viewport: null,
      fetchFields: async () => undefined,
    };

    Object.defineProperty(selectionEvent, 'placePrediction', {
      value: {
        toPlace: () => place,
      },
    });

    element.dispatchEvent(selectionEvent);
  });

  await expect(page.getByText('Rugjer Boshkovikj 16, Skopje')).toBeVisible();
}
