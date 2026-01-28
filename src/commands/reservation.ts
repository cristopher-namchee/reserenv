import type { Context } from 'hono';

import { Environments, normalizeEnvironments } from '../params';
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
  return {
    cardsV2: envData.map(({ env, meta }) => ({
      cardId: `card-${env}`,
      card: {
        header: {
          title: env,
          subtitle: 'GLChat Development Environment',
        },
        sections: [
          {
            collapsible: false,
            widgets: [
              {
                decoratedText: {
                  topLabel: 'Reserved By',
                  startIcon: {
                    knownIcon: 'EMAIL',
                  },
                  text: meta ? `<${meta.id}>` : '-',
                },
              },
              {
                decoratedText: {
                  topLabel: 'Reserved Since',
                  startIcon: {
                    knownIcon: 'CLOCK',
                  },
                  text: meta
                    ? new Date(meta.since).toLocaleDateString('en-GB', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '-',
                },
              },
            ],
          },
        ],
      },
    })),
  };
}

export default async function (c: Context<{ Bindings: Env }>) {
  const { user, message } = (await c.req.json()) as GoogleChatEvent;

  if (!message) {
    return c.json({});
  }

  if (!message.text.trim()) {
    const blockBody = await generateEnvironmentCards(
      Environments,
      c.env.ENVIRONMENT_RESERVATION,
    );

    return c.json({
      privateMessageViewer: user,
      ...blockBody,
    });
  }

  const [_, ...params] = message.text.split(/\s+/);
  const environments = normalizeEnvironments(params);

  if (environments.length === 0) {
    return c.json({
      privateMessageViewer: user,
      text: "The specified environment(s) doesn't exist!",
    });
  }

  if (environments.length === 1) {
    const environment = environments[0];

    const status = await c.env.ENVIRONMENT_RESERVATION.get(environment);

    if (!status) {
      return c.json({
        privateMessageViewer: user,
        text: `Environment \`${environment}\` is unused. You may reserve it with \`/reserve\` command`,
      });
    }

    const meta = JSON.parse(status);

    return c.json({
      privateMessageViewer: user,
      text: `Environment \`${environment}\` is being reserved by <${meta.id}> since ${new Date(
        meta.since,
      ).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`,
    });
  }

  const blockBody = await generateEnvironmentCards(
    environments,
    c.env.ENVIRONMENT_RESERVATION,
  );

  return c.json({
    privateMessageViewer: user,
    ...blockBody,
  });
}
