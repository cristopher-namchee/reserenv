import type { Context } from 'hono';

import { Environments } from '../const';
import { normalizeEnvironments } from '../lib/env';
import type { Env, GoogleChatEvent, ReservationInfo } from '../types';

export default async function (c: Context<{ Bindings: Env }>) {
  const { user, message, space } = (await c.req.json()) as GoogleChatEvent;

  if (!message?.text) {
    return c.json({});
  }

  const [_, ...params] = message.text.split(/\s+/);

  if (params.length === 0) {
    return c.json({
      text: `You need to specify the environment you want to reserve.

Available environment(s):

${Environments.map((env) => `- \`${env}\``).join('\n')}`,
    });
  }

  const environments = normalizeEnvironments(params);

  if (environments.length !== 1) {
    return c.json({
      text:
        environments.length === 0
          ? "The specified environment doesn't exist!"
          : 'To avoid resource hogging, you *cannot* reserve more than 1 environment at once for now. Please reserve them one by one.',
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
    });
  }

  const newMeta = JSON.stringify({
    email: user.email,
    name: user.displayName,
    since: new Date().toISOString(),
    channel: space.name,
  });
  await c.env.ENVIRONMENT_RESERVATION.put(environment, newMeta);

  return c.json({
    text: `Environment \`${environment}\` successfully reserved.`,
  });
}
