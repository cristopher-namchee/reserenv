import { Hono } from 'hono';

import reservation from './commands/reservation';
import reserve from './commands/reserve';
import unreserve from './commands/unreserve';

import type { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

app.post('/commands/reserve', reserve);
app.post('/commands/unreserve', unreserve);
app.post('/commands/reservation', reservation);

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
  scheduled: (
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ) => {
    ctx.waitUntil();
  },
};
