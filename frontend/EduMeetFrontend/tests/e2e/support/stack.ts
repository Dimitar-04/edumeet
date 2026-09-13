import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const supportDirectory = dirname(fileURLToPath(import.meta.url));

export const composeFile = resolve(
  supportDirectory,
  '../../../../..',
  'compose.e2e.yaml',
);

export function runCompose(...arguments_: string[]) {
  execFileSync(
    'docker',
    ['compose', '-f', composeFile, ...arguments_],
    { stdio: 'inherit' },
  );
}
