import { Hono } from 'hono';

import reservation from './commands/reservation';
import reserve from './commands/reserve';
import unreserve from './commands/unreserve';

import type { Bindings } from './types';

const app = new Hono<{ Bindings: Bindings }>();

app.post('/commands/reserve', reserve);
app.post('/commands/unreserve', unreserve);
app.post('/commands/reservation', reservation);

export default app;
