export const apiBaseUrl = 'http://localhost:5062/api';

const apiOrigin = new URL(apiBaseUrl).origin;

export function resolvePublicAssetUrl(path: string): string {
  return new URL(path, `${apiOrigin}/`).toString();
}
