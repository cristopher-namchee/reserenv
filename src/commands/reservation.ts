import type { Context } from 'hono';

import { EnvironmentAlias, Environments } from '../const';
import { formatDate } from '../lib/date';
import { normalizeEnvironments } from '../lib/env';
import { getChatLink, getGoogleAuthToken } from '../lib/google';
import type { Env, GoogleChatEvent, ReservationInfo } from '../types';

async function generateEnvironmentUsage(
  environments: string[],
  kv: KVNamespace,
  token: string,
  self: string,
) {
  const envData = await Promise.all(
    environments.map(async (env) => {
      const rawInfo = await kv.get(env);

      const user = JSON.parse(rawInfo ?? '{}') as ReservationInfo;

      const aliases = Object.entries(EnvironmentAlias).filter(
        ([_, value]) => value === env,
      );

      const room =
        user.email === self ? '' : await getChatLink(user?.email ?? '', token);

      return {
        cardId: `card-${env}`,
        card: {
          header: {
            title: env,
            subtitle: aliases.map((alias) => alias[0]).join(', '),
          },
          sections: [
            {
              header: 'Reservation Info',
              collapsible: true,
              widgets: [
                {
                  decoratedText: {
                    startIcon: {
                      knownIcon: 'PERSON',
                    },
                    text: user?.name ?? '-',
                  },
                },
                {
                  decoratedText: {
                    startIcon: {
                      knownIcon: 'EMAIL',
                    },
                    text: user?.email ?? '-',
                  },
                },
                {
                  decoratedText: {
                    startIcon: {
                      knownIcon: 'INVITE',
                    },
                    text: user?.since ? formatDate(user.since) : '-',
                  },
                },
                room
                  ? {
                      buttonList: {
                        buttons: [
                          {
                            text: 'Chat',
                            type: 'FILLED',
                            icon: {
                              materialIcon: {
                                name: 'chat',
                              },
                            },
                            onClick: {
                              openLink: {
                                url: room,
                              },
                            },
                          },
                        ],
                      },
                    }
                  : {},
              ],
            },
          ],
        },
      };
    }),
  );

  return {
    cardsV2: envData,
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
    const cards = await generateEnvironmentUsage(
      Environments,
      c.env.ENVIRONMENT_RESERVATION,
      token,
      user.email,
    );

    return c.json({
      text: 'Below are the list of GLChat development environment reservation usage.',
      ...cards,
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

    const meta = JSON.parse(status) as ReservationInfo;

    return c.json({
      text:
        meta.email === user.email
          ? 'You are currently reserving this environment.'
          : `Environment \`${environment}\` is being reserved by \`${meta.email}\` since ${formatDate(meta.since)}`,
    });
  }

  const cards = await generateEnvironmentUsage(
    environments,
    c.env.ENVIRONMENT_RESERVATION,
    token,
    user.email,
  );

  return c.json({
    text: 'Below are the list of requested GLChat development environment reservation usage.',
    ...cards,
  });
}
