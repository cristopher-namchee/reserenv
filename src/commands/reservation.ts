import type { Context } from 'hono';

import { EnvironmentAlias, Environments } from '../const';
import { formatDate } from '../lib/date';
import { normalizeEnvironments } from '../lib/env';
import { getChatLink, getGoogleAuthToken } from '../lib/google';
import type { Env, GoogleChatEvent, ReservationInfo } from '../types';

async function generateEnvironmentUsage(
  environments: string[],
  kv: KVNamespace,
) {
  const envData = await Promise.all(
    environments.map(async (env) => {
      const rawInfo = await kv.get(env);

      const user = rawInfo ? (JSON.parse(rawInfo) as ReservationInfo) : null;

      return { env, reservation: user };
    }),
  );

  return `Below are the list of GLChat environment reservation status.

  ${envData
    .map(
      ({ env, reservation }) => `⚙️ *${env}*
  ┗ ${
   reservation
     ? `👤 <https://contacts.google.com/${reservation.email}|${reservation.name}>
     🗓️ ${formatDate(reservation.since)}`
     : `_Available_`
 }`,
    )
    .join('\n\n')}
`;
}

export default async function (c: Context<{ Bindings: Env }>) {
  const { user, message } = (await c.req.json()) as GoogleChatEvent;

  const token = await getGoogleAuthToken(
    c.env.SERVICE_ACCOUNT_EMAIL,
    c.env.SERVICE_ACCOUNT_PRIVATE_KEY,
  );

  if (!message?.text || !token) {
    return c.json({});
  }

  const [_, ...params] = message.text.split(/\s+/);

  // only the slash
  if (params.length === 0) {
    const text = await generateEnvironmentUsage(
      Environments,
      c.env.ENVIRONMENT_RESERVATION,
    );

    return c.json({
      text,
    });
  }

  const environments = normalizeEnvironments(params);

  if (environments.length === 0) {
    return c.json({
      text: "The specified environment(s) doesn't exist!",
    });
  }

  if (environments.length === 1) {
    const environment = environments[0];

    const status = await c.env.ENVIRONMENT_RESERVATION.get(environment);

    if (!status) {
      return c.json({
        text: `Environment \`${environment}\` is unused. You may reserve it with \`/reserve\` command`,
      });
    }

    const reservation = JSON.parse(status) as ReservationInfo;

    return c.json({
      text:
        reservation.email === user.email
          ? 'You are currently reserving this environment.'
          : `Environment \`${environment}\` is being reserved by <https://contacts.google.com/${reservation.email}|${reservation.name}> since ${formatDate(reservation.since)}`,
    });
  }

  const text = await generateEnvironmentUsage(
    environments,
    c.env.ENVIRONMENT_RESERVATION,
  );

  return c.json({
    text,
  });
}
