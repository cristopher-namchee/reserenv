import type { Context } from 'hono';

import {
  EnvironmentAlias,
  Environments,
  ServiceLabel,
  Services,
} from '../const';
import { formatDate } from '../lib/date';
import { getGoogleAuthToken } from '../lib/google';
import { normalizeEnvironments } from '../lib/params';
import type { Env, GoogleChatEvent, ReservationInfo } from '../types';

async function generateEnvironmentUsage(
  environments: typeof Environments,
  kv: KVNamespace,
) {
  const envSections = await Promise.all(
    environments.map(async (env) => {
      const rawInfo = await Promise.all(
        Services.map(async (service) => ({
          service,
          info: await kv.get(`${env}-${service}`),
        })),
      );

      const alias = Object.entries(EnvironmentAlias)
        .filter(([_, value]) => value === env)
        .map(([key, _]) => `<code>${key}</code>`);

      return {
        header: env,
        collapsible: true,
        uncollapsibleWidgetsCount: alias.length ? 1 : 0,
        widgets: [
          alias.length
            ? { textParagraph: { text: `Also known as ${alias.join(', ')}` } }
            : undefined,
          ...rawInfo.map(({ service, info }) => {
            const user = info ? (JSON.parse(info) as ReservationInfo) : null;

            return {
              decoratedText: {
                icon: {
                  materialIcon: {
                    name: 'account_circle',
                  },
                },
                text: user
                  ? `<a href="https://contacts.google.com/${user.email}">${user.name}</a>`
                  : '-',
                bottomLabel: `${ServiceLabel[service]} ${user ? formatDate(user.since) : 'Available for reservation'}`,
              },
            };
          }),
        ].filter(Boolean),
      };
    }),
  );

  return {
    cardsV2: [
      {
        cardId: 'card-environment',
        card: {
          header: {
            title: 'Reservation Info',
          },
          sections: envSections,
        },
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
