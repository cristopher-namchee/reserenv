import type { Context } from 'hono';

import { ENVIRONMENTS } from '../constants';
import type { Bindings } from '../types';

async function generateEnvironmentTables(
  environments: string[],
  kv: KVNamespace,
) {
  const textBlock = (text: string, bold = false) => ({
    type: 'rich_text',
    elements: [
      {
        type: 'rich_text_section',
        elements: [
          {
            type: 'text',
            text,
            ...(bold ? { style: { bold: true } } : {}),
          },
        ],
      },
    ],
  });

  const envData = await Promise.all(
    environments.map(async (env) => {
      const user = await kv.get(env);
      if (!user) return { env, meta: null };
      return { env, meta: JSON.parse(user) };
    }),
  );

  // Build rows
  const headers = [
    textBlock('', false),
    ...environments.map((env) => textBlock(env, true)),
  ];

  const reservedBy = [
    textBlock('Reserved By', true),
    ...envData.map(({ meta }) =>
      meta ? textBlock(`<@U${meta.id}>`) : textBlock('-'),
    ),
  ];

  const reservedSince = [
    textBlock('Reserved Since', true),
    ...envData.map(({ meta }) =>
      meta
        ? textBlock(
            new Date(meta.since).toLocaleDateString('en-GB', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
          )
        : textBlock('-'),
    ),
  ];

  return {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Below are the list of available GLChat development environments.',
        },
      },
      {
        type: 'table',
        rows: [headers, reservedBy, reservedSince],
      },
    ],
  };
}

export default async function (c: Context<{ Bindings: Bindings }>) {
  const { text } = await c.req.parseBody();

  let environment = '';
  if (typeof text === 'string') {
    const params = text.split(/\s+/);
    environment = params[0];
  }

  if (!environment) {
    const blockBody = await generateEnvironmentTables(
      ENVIRONMENTS,
      c.env.ENVIRONMENT_RESERVATION,
    );

    return c.json({
      blocks: blockBody,
      response_type: 'ephemeral',
    });
  }

  if (!ENVIRONMENTS.includes(environment)) {
    return c.json({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: "The specified environment doesn't exist!",
          },
        },
      ],
      response_type: 'ephemeral',
    });
  }

  const status = await c.env.ENVIRONMENT_RESERVATION.get(environment);
  if (!status) {
    return c.json({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Environment ${environment} is unused. You may reserve it with \`/reserve\` command`,
          },
        },
      ],
      response_type: 'ephemeral',
    });
  }

  const meta = JSON.parse(status);

  return c.json({
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Environment ${environment} is being reserved by <@U${meta.id}> since ${new Date(
            meta.since,
          ).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}`,
        },
      },
    ],
    response_type: 'ephemeral',
  });
}
