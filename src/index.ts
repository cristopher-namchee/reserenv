import { type Context, Hono } from 'hono';

import reservation from './commands/reservation';
import reserve from './commands/reserve';
import unreserve from './commands/unreserve';

import sendReminder from './scheduler/reminder';

import type { Env, GoogleChatEvent } from './types';

const commandMap: Record<
  string,
  (c: Context<{ Bindings: Env }>) => Promise<Response>
> = {
  '1': reservation,
  '2': reserve,
  '3': unreserve,
};

const app = new Hono<{ Bindings: Env }>();

// Google Chat
app.post('/', async (c) => {
  const event = (await c.req.json()) as GoogleChatEvent;

  const isDM =
    event.space.type === 'DIRECT_MESSAGE' && event.space.singleUserBotDm;

  // ignore request outside the designated space
  if (event.user.type === 'BOT' || !isDM) {
    return c.json({});
  }

  if (
    event.type === 'MESSAGE' &&
    event.message?.slashCommand &&
    commandMap[event.message.slashCommand.commandId]
  ) {
    return commandMap[event.message.slashCommand.commandId](c);
  }

  return c.json({});
});

app.onError((_e, c) => {
  return c.json(
    {
      message: 'Unable to handle event',
    },
    500,
  );
});

export default {
  fetch: app.fetch,
  scheduled: async (
    _: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ) => {
    ctx.waitUntil(sendReminder(env));
  },
};
