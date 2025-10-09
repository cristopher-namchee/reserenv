import type { Context } from 'hono';

import { ENVIRONMENTS } from '../constants';
import type { Bindings } from '../types';

function generateTextBlock(text: string, bold = false) {
  return {
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
  };
}

function generateUserBlock(user_id: string) {
  return {
    type: 'rich_text',
    elements: [
      {
        type: 'rich_text_section',
        elements: [
          {
            type: 'user',
            user_id,
          },
        ],
      },
    ],
  };
}

async function generateEnvironmentTables(
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

  const headers = [
    generateTextBlock(' ', false),
    ...environments.map((env) => generateTextBlock(env, true)),
  ];

  const reservedBy = [
    generateTextBlock('Reserved By', true),
    ...envData.map(({ meta }) =>
      meta ? generateUserBlock(meta.id) : generateTextBlock('-'),
    ),
  ];

  const reservedSince = [
    generateTextBlock('Reserved Since', true),
    ...envData.map(({ meta }) =>
      meta
        ? generateTextBlock(
            new Date(meta.since).toLocaleDateString('en-GB', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
          )
        : generateTextBlock('-'),
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

  const environments = [];
  if (typeof text === 'string') {
    const params = text.trim().split(/\s+/);
    environments.push(...params);
  }

  console.log(environments.length, JSON.stringify(environments, null, 2));

  if (!environments.length) {
    const blockBody = await generateEnvironmentTables(
      ENVIRONMENTS,
      c.env.ENVIRONMENT_RESERVATION,
    );

    return c.json({
      ...blockBody,
      response_type: 'ephemeral',
    });
  }

  const validEnvironments = environments.filter((env) =>
    ENVIRONMENTS.includes(env),
  );

  if (validEnvironments.length === 0) {
    return c.json({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: "The specified environment(s) doesn't exist!",
          },
        },
      ],
      response_type: 'ephemeral',
    });
  }

  if (validEnvironments.length === 1) {
    const environment = validEnvironments[0];

    const status = await c.env.ENVIRONMENT_RESERVATION.get(environment);

    if (!status) {
      return c.json({
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Environment \`${environment}\` is unused. You may reserve it with \`/reserve\` command`,
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
            text: `Environment \`${environment}\` is being reserved by <@${meta.id}> since ${new Date(
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

  const blockBody = await generateEnvironmentTables(
    validEnvironments,
    c.env.ENVIRONMENT_RESERVATION,
  );

  return c.json({
    ...blockBody,
    response_type: 'ephemeral',
  });
}
