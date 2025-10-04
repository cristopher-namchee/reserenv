import type { Context } from 'hono';

import { ENVIRONMENTS } from '../constants';
import type { Bindings } from '../types';

export default async function (c: Context<{ Bindings: Bindings }>) {
  const { text, user_id } = await c.req.parseBody();
  if (!text || !user_id || typeof text !== 'string') {
    return c.notFound();
  }

  const params = text.split(/\s+/);
  const environment = params[0];

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

  const meta = await c.env.KV.get(environment);
  if (meta) {
    const { id } = JSON.parse(meta);

    await fetch(c.env.SLACK_WEBHOOK_URL, {
      body: JSON.stringify({
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Environment ${environment} is still being reserved by <@U${id}>. Please ask the user to unreserve it first.`,
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

  const newMeta = JSON.stringify({
    id: user_id,
    since: new Date().toISOString(),
  });
  await c.env.KV.put(environment, newMeta);

  await fetch(c.env.SLACK_WEBHOOK_URL, {
    body: JSON.stringify({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Environment ${environment} successfully reserved.`,
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
