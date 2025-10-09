import type { Context } from 'hono';
import { Environments, normalizeEnvironments } from '../params';
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

  if (typeof text !== 'string') {
    return c.notFound();
  }

  if (!text.trim()) {
    const blockBody = await generateEnvironmentTables(
      Environments,
      c.env.ENVIRONMENT_RESERVATION,
    );

    return c.json({
      ...blockBody,
      response_type: 'ephemeral',
    });
  }

  const environments = normalizeEnvironments(text.split(/\s+/));

  if (environments.length === 0) {
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

  if (environments.length === 1) {
    const environment = environments[0];

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
    environments,
    c.env.ENVIRONMENT_RESERVATION,
  );

  return c.json({
    ...blockBody,
    response_type: 'ephemeral',
  });
}
