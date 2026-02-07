import type { Context } from 'hono';

import { Environments } from '../const';
import { normalizeEnvironments } from '../lib/env';
import type { Env, GoogleChatEvent } from '../types';

async function generateEnvironmentCards(
  environments: string[],
  kv: KVNamespace,
) {
  const envData = await Promise.all(
    environments.map(async (env) => {
      const user = await kv.get(env);
      if (!user) return { env, meta: null };
      return { env, meta: JSON.parse(user) };
    }),
  );

  return `Below are the list of the reservation status.

${envData
  .map(
    ({ env, meta }) =>
      `*${env}*\n\n_Reserved By_: ${meta ? `<${meta.id}>` : '-'}\n_Reserved Since_: ${
        meta
          ? new Date(meta.since).toLocaleDateString('en-GB', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })
          : '-'
      }`,
  )
  .join('\n\n')}`;
}

export default async function (c: Context<{ Bindings: Env }>) {
  const { user, message } = (await c.req.json()) as GoogleChatEvent;

  if (!message?.text) {
    return c.json({});
  }

  const [_, ...params] = message.text.split(/\s+/);

  // only the slash
  if (params.length === 0) {
    const text = await generateEnvironmentCards(
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

    const meta = JSON.parse(status);

    return c.json({
      text:
        meta.id === user.name
          ? 'You are currently reserving this environment.'
          : `Environment \`${environment}\` is being reserved by <${meta.id}> since ${new Date(
              meta.since,
            ).toLocaleDateString('en-GB', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}`,
    });
  }

  const text = await generateEnvironmentCards(
    environments,
    c.env.ENVIRONMENT_RESERVATION,
  );

  return c.json({
    text,
  });
}
