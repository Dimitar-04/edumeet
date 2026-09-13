export const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:5062/api';

const apiOrigin = new URL(apiBaseUrl).origin;

export function resolvePublicAssetUrl(path: string): string {
  return new URL(path, `${apiOrigin}/`).toString();
}
