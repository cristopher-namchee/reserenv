import { sign } from 'hono/jwt';

import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';

import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { getGoogleAuthToken } from './lib';

const mockServer = setupServer();

vi.mock('hono/jwt', () => ({
  sign: vi.fn(),
}));

describe('getGoogleAuthToken', () => {
  beforeAll(() => {
    mockServer.listen();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    mockServer.resetHandlers();
    vi.resetAllMocks();
  });

  afterAll(() => {
    mockServer.close();
  });

  it('should resolve into empty string due to connection error', async () => {
    mockServer.use(
      http.post('https://oauth2.googleapis.com/token', () => {
        throw new Error('Connection Error');
      }),
    );

    const jwtSpy = vi.mocked(sign);
    const result = await getGoogleAuthToken('example@domain.com', 'key');

    expect(result).toBe('');
    expect(jwtSpy).toHaveBeenCalledOnce();
  });

  it('should resolve into an access token', async () => {
    mockServer.use(
      http.post('https://oauth2.googleapis.com/token', () => {
        return HttpResponse.json({ access_token: 'token' });
      }),
    );

    const jwtSpy = vi.mocked(sign);
    const result = await getGoogleAuthToken('example@domain.com', 'key');

    expect(result).toBe('token');
    expect(jwtSpy).toHaveBeenCalledOnce();
  });
});
