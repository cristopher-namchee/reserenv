import type { Context } from 'hono';

import { Environments } from '../const';
import { normalizeEnvironments } from '../lib/env';
import type { Env, GoogleChatEvent, ReservationInfo } from '../types';

export default async function (c: Context<{ Bindings: Env }>) {
  const { user, message } = (await c.req.json()) as GoogleChatEvent;

  if (!message?.text) {
    return c.json({});
  }

  const [_, ...params] = message.text.split(/\s+/);

  if (params.length === 0) {
    return c.json({
      text: `You need to specify the environment you want to reserve.

Available environment(s):

${Environments.map((env) => `- \`${env}\``).join('\n')}`,
      privateMessageViewer: {
        name: user.name,
      },
    });
  }

  // extract only the first one
  const environments = normalizeEnvironments([params[1]]);

  if (environments.length !== 1) {
    return c.json({
      text: `The specified environment(s) don't exist!

Available environment(s):

${Environments.map((env) => `- \`${env}\``).join('\n')}`,
      privateMessageViewer: {
        name: user.name,
      },
    });
  }

  const environment = environments[0];

  const reservation = await c.env.ENVIRONMENT_RESERVATION.get(environment);
  if (reservation) {
    const { email, name } = JSON.parse(reservation) as ReservationInfo;

    return c.json({
      text:
        email === user.email
          ? 'You have this environment reserved already!'
          : `Environment \`${environment}\` is still being reserved by <https://contacts.google.com/${email}|${name}>. Please ask the user to unreserve it first.`,
      privateMessageViewer: {
        name: user.name,
      },
    });
  }

  const newMeta = JSON.stringify({
    id: user.name,
    email: user.email,
    name: user.displayName,
    since: new Date().toISOString(),
  });
  await c.env.ENVIRONMENT_RESERVATION.put(environment, newMeta);

  return c.json({
    text: `Environment \`${environment}\` successfully reserved.`,
    privateMessageViewer: {
      name: user.name,
    },
  });
}
