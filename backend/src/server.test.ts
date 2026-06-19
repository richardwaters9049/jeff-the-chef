// Exercises backend health, request validation, provider isolation, and safe failure responses.
import { afterEach, describe, expect, it } from 'vitest';
import type { AssistantProvider } from './assistant.js';
import { buildServer } from './server.js';

const servers: ReturnType<typeof buildServer>[] = [];

afterEach(async () => {
  await Promise.all(servers.splice(0).map((server) => server.close()));
});

describe('Jeff backend', () => {
  it('reports its health without exposing configuration', async () => {
    const server = buildServer();
    servers.push(server);
    const response = await server.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('rejects unknown request fields', async () => {
    const server = buildServer();
    servers.push(server);
    const response = await server.inject({
      method: 'POST',
      url: '/v1/assistant',
      payload: { input: 'How long should salmon rest?', secretNote: 'private' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error).toBe('invalid_request');
  });

  it('returns a schema-validated provider answer', async () => {
    const provider: AssistantProvider = {
      async answer(_request, requestId) {
        return {
          answer: 'Let it rest for about 3–5 minutes.',
          suggestedActions: [],
          requestId,
        };
      },
    };
    const server = buildServer({ provider });
    servers.push(server);
    const response = await server.inject({
      method: 'POST',
      url: '/v1/assistant',
      payload: { input: 'How long should salmon rest?', locale: 'en-GB' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().answer).toContain('3–5 minutes');
  });

  it('keeps provider failures generic and local tools independent', async () => {
    const server = buildServer();
    servers.push(server);
    const response = await server.inject({
      method: 'POST',
      url: '/v1/assistant',
      payload: { input: 'What can I substitute for buttermilk?' },
    });

    expect(response.statusCode).toBe(503);
    expect(response.json().message).toContain('Local tools still work');
  });
});
