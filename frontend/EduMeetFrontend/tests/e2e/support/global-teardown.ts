import { runCompose } from './stack';

export default function globalTeardown() {
  if (process.env.EDUMEET_E2E_REUSE_STACK === 'true') return;

  runCompose('down', '--volumes', '--remove-orphans');
}
