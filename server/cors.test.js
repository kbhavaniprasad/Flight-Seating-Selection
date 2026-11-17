import { describe, expect, it, vi } from 'vitest';
import { corsMiddleware } from './app.js';

function createResponse() {
  const headers = {};
  const response = {
    headers,
    statusCode: 200,
    body: null,
    set(name, value) {
      headers[name.toLowerCase()] = value;
      return this;
    },
    vary: vi.fn(),
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    sendStatus(code) {
      this.statusCode = code;
      return this;
    },
  };
  return response;
}

function createRequest({ origin, method = 'OPTIONS', requestedMethod = 'POST' }) {
  const headers = {
    origin,
    'access-control-request-method': requestedMethod,
  };
  return {
    method,
    get(name) {
      return headers[name.toLowerCase()];
    },
  };
}

describe('CORS middleware', () => {
  it.each([
    'https://flight-seating-selection.vercel.app',
    'http://localhost:5173',
  ])('allows preflight from %s with required methods and headers', (origin) => {
    const request = createRequest({ origin });
    const response = createResponse();
    const next = vi.fn();

    corsMiddleware(request, response, next);

    expect(response.statusCode).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe(origin);
    expect(response.headers['access-control-allow-methods']).toContain('POST');
    expect(response.headers['access-control-allow-methods']).toContain('OPTIONS');
    expect(response.headers['access-control-allow-headers']).toContain('Content-Type');
    expect(response.headers['access-control-allow-headers']).toContain('Authorization');
    expect(response.headers['access-control-allow-credentials']).toBeUndefined();
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects unlisted origins and unsupported preflight methods', () => {
    const rejectedOrigin = createResponse();
    corsMiddleware(
      createRequest({ origin: 'https://untrusted.example' }),
      rejectedOrigin,
      vi.fn()
    );
    expect(rejectedOrigin.statusCode).toBe(403);
    expect(rejectedOrigin.headers['access-control-allow-origin']).toBeUndefined();

    const rejectedMethod = createResponse();
    corsMiddleware(
      createRequest({
        origin: 'https://flight-seating-selection.vercel.app',
        requestedMethod: 'DELETE',
      }),
      rejectedMethod,
      vi.fn()
    );
    expect(rejectedMethod.statusCode).toBe(405);
  });
});
