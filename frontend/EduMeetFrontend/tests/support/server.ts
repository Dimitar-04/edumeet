import { setupServer } from 'msw/node';

// Shared request boundary for frontend tests.
export const server = setupServer();
