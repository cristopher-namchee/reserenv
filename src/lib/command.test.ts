import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Services } from '../const';
import type { Env } from '../types';
import { handleWriteCommand } from './command';

describe('handleWriteCommand', () => {
  const app = new Hono<{ Bindings: Env }>();
  const fn = vi.fn();

  app.post('/', (c) => handleWriteCommand(c, fn));

  beforeEach(() => {
    fn.mockResolvedValue({ success: true, message: 'Operation success' });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should return empty object if message is empty', async () => {
    const res = await app.request('/', {
      method: 'POST',
      body: JSON.stringify({
        type: 'MESSAGE',
        message: {},
        user: {
          name: '123',
          type: 'HUMAN',
          email: 'cristopher@gdplabs.id',
          displayName: 'Cristopher',
        },
      }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({});

    expect(fn).not.toHaveBeenCalled();
  });

  it('should return error message if command does not have environment', async () => {
    const res = await app.request('/', {
      method: 'POST',
      body: JSON.stringify({
        type: 'MESSAGE',
        message: {
          text: '/reserve',
          slashCommand: {
            commandId: '2',
          },
        },
        user: {
          name: '123',
          type: 'HUMAN',
          email: 'cristopher@gdplabs.id',
          displayName: 'Cristopher',
        },
      }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      privateMessageViewer: {
        name: '123',
      },
      text: `You need to specify the environment you want to reserve.

Available environments:

- \`dev\`
- \`dev2\`
- \`dev3\`
- \`stag\``,
    });

    expect(fn).not.toHaveBeenCalled();
  });

  it('should return error message if the provided environment is invalid', async () => {
    const res = await app.request('/', {
      method: 'POST',
      body: JSON.stringify({
        type: 'MESSAGE',
        message: {
          text: '/reserve foo',
          slashCommand: {
            commandId: '2',
          },
        },
        user: {
          name: '123',
          type: 'HUMAN',
          email: 'cristopher@gdplabs.id',
          displayName: 'Cristopher',
        },
      }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      privateMessageViewer: {
        name: '123',
      },
      text: `The specified environment doesn't exist!

Available environments:

- \`dev\`
- \`dev2\`
- \`dev3\`
- \`stag\``,
    });

    expect(fn).not.toHaveBeenCalled();
  });

  it('should return error message if the provided service(s) is invalid', async () => {
    const res = await app.request('/', {
      method: 'POST',
      body: JSON.stringify({
        type: 'MESSAGE',
        message: {
          text: '/reserve dev bar',
          slashCommand: {
            commandId: '2',
          },
        },
        user: {
          name: '123',
          type: 'HUMAN',
          email: 'cristopher@gdplabs.id',
          displayName: 'Cristopher',
        },
      }),
    });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      privateMessageViewer: {
        name: '123',
      },
      text: `The specified service(s) doesn't exist!

Available services:

- \`frontend\`
- \`backend\`
- \`dpo\``,
    });

    expect(fn).not.toHaveBeenCalled();
  });

  it('should return success message if all parameters are valid', async () => {
    const res = await app.request(
      '/',
      {
        method: 'POST',
        body: JSON.stringify({
          type: 'MESSAGE',
          message: {
            text: '/reserve dev frontend',
            slashCommand: {
              commandId: '2',
            },
          },
          user: {
            name: '123',
            type: 'HUMAN',
            email: 'cristopher@gdplabs.id',
            displayName: 'Cristopher',
          },
        }),
      },
      {
        ENVIRONMENT_RESERVATION: {},
      },
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      privateMessageViewer: {
        name: '123',
      },
      text: `✅ Operation success

1 of 1 request succeeded.`,
    });

    expect(fn).toHaveBeenCalledOnce();
  });

  it('should process all services if the service are omitted', async () => {
    const res = await app.request(
      '/',
      {
        method: 'POST',
        body: JSON.stringify({
          type: 'MESSAGE',
          message: {
            text: '/reserve dev',
            slashCommand: {
              commandId: '2',
            },
          },
          user: {
            name: '123',
            type: 'HUMAN',
            email: 'cristopher@gdplabs.id',
            displayName: 'Cristopher',
          },
        }),
      },
      {
        ENVIRONMENT_RESERVATION: {},
      },
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      privateMessageViewer: {
        name: '123',
      },
      text: `✅ Operation success
✅ Operation success
✅ Operation success

3 of 3 requests succeeded.`,
    });

    expect(fn).toHaveBeenCalledTimes(Services.length);
  });

  it('should allow partial success', async () => {
    const res = await app.request(
      '/',
      {
        method: 'POST',
        body: JSON.stringify({
          type: 'MESSAGE',
          message: {
            text: '/reserve dev fe foo',
            slashCommand: {
              commandId: '2',
            },
          },
          user: {
            name: '123',
            type: 'HUMAN',
            email: 'cristopher@gdplabs.id',
            displayName: 'Cristopher',
          },
        }),
      },
      {
        ENVIRONMENT_RESERVATION: {},
      },
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      privateMessageViewer: {
        name: '123',
      },
      text: `✅ Operation success
❌ Service \`foo\` doesn't exist in environment \`dev\`

1 of 2 requests succeeded.`,
    });

    expect(fn).toHaveBeenCalledTimes(1);
  });
});
