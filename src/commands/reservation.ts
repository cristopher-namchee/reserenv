import type { Context } from 'hono';

import {
  EnvironmentAlias,
  Environments,
  ServiceIcon,
  ServiceLabel,
  Services,
} from '../const';
import { formatDate } from '../lib/date';
import { normalizeEnvironments } from '../lib/params';
import type { Env, GoogleChatEvent, ReservationInfo } from '../types';

function createAliasWidget(env: string) {
  const aliases = Object.entries(EnvironmentAlias)
    .filter(([_, value]) => value === env)
    .map(([key, _]) => `<code>${key}</code>`);

  if (aliases.length === 0) return null;

  return {
    textParagraph: {
      text: `Also known as ${aliases.join(', ')}`,
    },
  };
}

function createServiceWidget(service: string, info: string | null) {
  const user = info ? (JSON.parse(info) as ReservationInfo) : null;
  const key = service as keyof typeof ServiceIcon;

  return {
    decoratedText: {
      icon: {
        materialIcon: {
          name: ServiceIcon[key],
        },
      },
      text: user
        ? `<a href="https://contacts.google.com/${user.email}">${user.name}</a>`
        : '-',
      bottomLabel: `${ServiceLabel[key]} — ${user ? formatDate(user.since) : 'Available for reservation'}`,
    },
  };
}

async function getServiceReservations(kv: KVNamespace, env: string) {
  return Promise.all(
    Services.map(async (service) => ({
      service,
      info: await kv.get(`${env}-${service}`),
    })),
  );
}

async function createEnvironmentSection(kv: KVNamespace, env: string) {
  const serviceReservations = await getServiceReservations(kv, env);
  const aliasWidget = createAliasWidget(env);

  const widgets = [
    aliasWidget,
    ...serviceReservations.map(({ service, info }) =>
      createServiceWidget(service, info),
    ),
  ].filter(Boolean);

  return {
    header: env,
    collapsible: true,
    uncollapsibleWidgetsCount: aliasWidget ? 1 : 0,
    widgets,
  };
}

async function generateEnvironmentUsage(
  environments: typeof Environments,
  kv: KVNamespace,
) {
  const envSections = await Promise.all(
    environments.map((env) => createEnvironmentSection(kv, env)),
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

  if (!message?.text) {
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
