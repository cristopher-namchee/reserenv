import type { Context } from 'hono';

import { ENVIRONMENTS } from '../constants';
import type { Bindings } from '../types';

async function generateEnvironmentTables(
  environments: string[],
  kv: KVNamespace,
) {
  // Helper for creating a text block
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

  // Fetch all KV values in parallel
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
    const blockBody = await generateEnvironmentTables(ENVIRONMENTS, c.env.KV);

    await fetch(c.env.SLACK_WEBHOOK_URL, {
      body: JSON.stringify({
        block: blockBody,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    });
  }

  if (!ENVIRONMENTS.includes(environment)) {
    await fetch(c.env.SLACK_WEBHOOK_URL, {
      body: JSON.stringify({
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: "The specified environment doesn't exist!",
            },
          },
        ],
      }),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return c.text('OK');
  }

  const status = await c.env.KV.get(environment);
  if (!status) {
    await fetch(c.env.SLACK_WEBHOOK_URL, {
      body: JSON.stringify({
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Environment ${environment} is unused. You may reserve it with \`/reserve\` command`,
            },
          },
        ],
      }),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return c.text('OK');
  }

  const meta = JSON.parse(status);

  await fetch(c.env.SLACK_WEBHOOK_URL, {
    body: JSON.stringify({
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
    }),
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return c.text('OK');
}
