import type { Context } from 'hono';

import { EnvironmentAlias, Environments } from '../const';
import { formatDate } from '../lib/date';
import { normalizeEnvironments } from '../lib/env';
import { getGoogleAuthToken } from '../lib/google';
import type { Env, GoogleChatEvent, ReservationInfo } from '../types';

async function generateEnvironmentUsage(
  environments: string[],
  kv: KVNamespace,
) {
  const envSections = await Promise.all(
    environments.map(async (env) => {
      const rawInfo = await kv.get(env);

      const user = rawInfo ? (JSON.parse(rawInfo) as ReservationInfo) : null;

      const alias = Object.entries(EnvironmentAlias)
        .filter(([_, value]) => value === env)
        .map(([key, _]) => `\`${key}\``);

      return {
        header: env,
        collapsible: true,
        widgets: [
          alias
            ? { textParagraph: `Also known as ${alias.join(', ')}` }
            : undefined,
          {
            decoratedText: {
              icon: {
                materialIcon: {
                  name: 'account_circle',
                },
              },
              text: user
                ? `<a href="https://contacts.google.com/${user.email}">${user.name}</a>`
                : '-',
              bottomLabel: user
                ? formatDate(user.since)
                : 'Available for reservation',
            },
          },
        ].filter(Boolean),
      };
    }),
  );

  return {
    cardsV2: [
      {
        cardId: 'card-environment',
        header: {
          title: 'Reservation Info',
        },
        sections: envSections,
      },
    ],
  };
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
    const card = await generateEnvironmentUsage(
      Environments,
      c.env.ENVIRONMENT_RESERVATION,
    );

    return c.json({
      ...card,
      privateMessageViewer: {
        name: user.name,
      },
    });
  }

  const environments = normalizeEnvironments(params);

  if (environments.length === 0) {
    return c.json({
      text: "The specified environment(s) doesn't exist!",
      privateMessageViewer: {
        name: user.name,
      },
    });
  }

  if (environments.length === 1) {
    const environment = environments[0];

    const status = await c.env.ENVIRONMENT_RESERVATION.get(environment);

    if (!status) {
      return c.json({
        text: `Environment \`${environment}\` is unused. You may reserve it with \`/reserve\` command`,
        privateMessageViewer: {
          name: user.name,
        },
      });
    }

    const reservation = JSON.parse(status) as ReservationInfo;

    return c.json({
      text:
        reservation.email === user.email
          ? 'You are currently reserving this environment.'
          : `Environment \`${environment}\` is being reserved by <https://contacts.google.com/${reservation.email}|${reservation.name}> since ${formatDate(reservation.since)}`,
      privateMessageViewer: {
        name: user.name,
      },
    });
  }

  const card = await generateEnvironmentUsage(
    environments,
    c.env.ENVIRONMENT_RESERVATION,
  );

  return c.json({
    ...card,
    privateMessageViewer: {
      name: user.name,
    },
  });
}
