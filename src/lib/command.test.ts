import { describe, expect, it } from 'vitest';
import { app } from '..';

// interface GoogleChatEvent {
//   type: string;
//   space: {
//     name: string;
//     type: 'SPACE' | 'DM';
//     singleUserBotDm: boolean;
//   };
//   message?: {
//     text: string;
//     slashCommand?: {
//       commandId: string;
//     };
//   };
//   user: {
//     name: string;
//     type: 'HUMAN' | 'BOT';
//     email: string;
//     displayName: string;
//   };
// }

describe('handleWriteCommand', () => {
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

Available environment(s):

- \`dev\`
- \`dev2\`
- \`dev3\`
- \`stag\``,
    });
  });
});
